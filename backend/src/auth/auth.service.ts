import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { EmailService } from '../email/email.service';
import {
  accountApprovedEmail,
  accountRejectedEmail,
  signupPendingAdminEmail,
} from '../email/email.templates';
import { ApproveAction, ApproveDto } from './dto/approve.dto';
import { SignupDto, SignupRole } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly email: EmailService,
    private readonly config: ConfigService
  ) {}

  /** Fetch all sections — uses service-role client to bypass RLS (public endpoint). */
  async getSections() {
    const db = this.supabase.getServiceClient()
    const { data, error } = await db
      .from('sections')
      .select('id, name, semester')
      .order('name', { ascending: true })

    if (error) throw new BadRequestException(error.message)
    return data ?? []
  }

  async signup(dto: SignupDto) {
    if (dto.role === SignupRole.STUDENT) {
      if (!dto.studentNo || (!dto.sectionId && !dto.section)) {
        throw new BadRequestException('studentNo and section are required for student role');
      }
      const studentNoRegex = /^\d{2}-\d{5}$/;
      if (!studentNoRegex.test(dto.studentNo)) {
        throw new BadRequestException('Student ID must follow the format 00-00000 (e.g., 22-00133)');
      }
    }

    if (dto.role === SignupRole.INSTRUCTOR) {
      if (!dto.employeeId || !dto.department) {
        throw new BadRequestException('employeeId and department are required for instructor role');
      }
      const employeeIdRegex = /^EMP-\d{4}-\d{4}$/;
      if (!employeeIdRegex.test(dto.employeeId)) {
        throw new BadRequestException('Instructor ID must follow the format EMP-0000-0000 (digits only)');
      }
    }

    const db = this.supabase.getServiceClient()

    const { data: authData, error: authError } = await db.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true,
    })

    if (authError) {
      throw new BadRequestException(authError.message)
    }

    const userId = authData.user.id

    const { error: profileError } = await db.from('profiles').upsert(
      {
        id: userId,
        first_name: dto.firstName,
        last_name: dto.lastName,
        full_name: `${dto.firstName} ${dto.lastName}`.trim(),
        email: dto.email,
        role: dto.role,
        status: 'pending',
      },
      { onConflict: 'id' }
    )

    if (profileError) {
      await db.auth.admin.deleteUser(userId)
      throw new BadRequestException(profileError.message)
    }

    try {
      if (dto.role === SignupRole.STUDENT) {
        // Resolve section ID — prefer direct UUID, fall back to name lookup
        let resolvedSectionId: string | null = dto.sectionId ?? null

        if (!resolvedSectionId && dto.section) {
          const { data: sectionRow } = await db
            .from('sections')
            .select('id')
            .eq('name', dto.section)
            .single()
          resolvedSectionId = sectionRow?.id ?? null
        }

        const { error: studentError } = await db.from('students').upsert(
          {
            id: userId,
            student_no: dto.studentNo!,
            section_id: resolvedSectionId,
          },
          { onConflict: 'id' }
        )

        if (studentError) throw studentError
      } else if (dto.role === SignupRole.INSTRUCTOR) {
        const { error: instructorError } = await db.from('instructors').upsert(
          {
            id: userId,
            employee_id: dto.employeeId!,
            department: dto.department!,
          },
          { onConflict: 'id' }
        )

        if (instructorError) throw instructorError
      }
    } catch (error: any) {
      await db.from('profiles').delete().eq('id', userId)
      await db.auth.admin.deleteUser(userId)
      
      let errMsg = 'Registration failed'
      if (error instanceof Error) {
        errMsg = error.message
      } else if (error && typeof error === 'object' && error.message) {
        errMsg = error.message
      } else {
        errMsg = String(error)
      }
      
      // Map raw Postgres unique constraint errors to user-friendly messages
      if (errMsg.includes('students_student_no_key')) {
        errMsg = 'This Student Number is already registered.'
      } else if (errMsg.includes('instructors_employee_id_key')) {
        errMsg = 'This Employee ID is already registered.'
      } else if (errMsg.includes('profiles_email_key') || errMsg.includes('already exists')) {
        errMsg = 'An account with this information already exists.'
      }
      
      throw new BadRequestException(errMsg)
    }

    const fullName = `${dto.firstName} ${dto.lastName}`.trim();
    // Fire-and-forget — email failure must NOT block account creation.
    // The admin can still see and approve the account via the dashboard.
    this.email
      .sendEmail(
        this.config.get<string>('ADMIN_EMAIL')!,
        `New registration request - ${fullName}`,
        signupPendingAdminEmail({
          userName: fullName,
          userEmail: dto.email,
          role: dto.role,
          requestedDate: new Date().toLocaleString(),
        }),
        'signup_pending'
      )
      .catch((err) =>
        console.warn('Admin notification email failed (non-fatal):', err?.message ?? err)
      )

    return { success: true }
  }

  async approveUser(dto: ApproveDto, accessToken: string) {
    const caller = await this.supabase.verifyAndGetProfile(accessToken)

    if (
      !caller ||
      caller.profile.role !== 'admin' ||
      caller.profile.status !== 'approved'
    ) {
      throw new UnauthorizedException('Admin access required')
    }

    const db = this.supabase.getServiceClient()

    // 1. Fetch the profile details first to know who to email
    const { data: profile, error } = await db
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', dto.userId)
      .single()

    if (error || !profile) {
      throw new BadRequestException(error?.message ?? 'Profile not found')
    }

    // 2. Perform the database action
    if (dto.action === ApproveAction.APPROVE) {
      const { error: updateError } = await db
        .from('profiles')
        .update({ status: 'approved' })
        .eq('id', dto.userId)

      if (updateError) throw new BadRequestException(updateError.message)
    } else {
      // If rejecting, fully delete the user from Supabase Auth.
      // Since our schema uses ON DELETE CASCADE, this automatically wipes their
      // row from 'profiles', 'students', and 'instructors' so they can try to sign up again freely.
      const { error: deleteError } = await db.auth.admin.deleteUser(dto.userId)
      if (deleteError) throw new BadRequestException(deleteError.message)
    }

    const appUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000'

    const userName = `${profile.first_name} ${profile.last_name}`.trim();

    // Fire-and-forget — email failure must NOT block the approve/reject action.
    if (dto.action === ApproveAction.APPROVE) {
      this.email
        .sendEmail(
          profile.email,
          'Your Maternix Track account is approved',
          accountApprovedEmail({ userName, appUrl }),
          'approved'
        )
        .catch((err) => console.warn('Approval email failed (non-fatal):', err?.message ?? err))
    } else {
      this.email
        .sendEmail(
          profile.email,
          'Maternix Track - Account update',
          accountRejectedEmail({ userName, reason: dto.reason }),
          'rejected'
        )
        .catch((err) => console.warn('Rejection email failed (non-fatal):', err?.message ?? err))
    }

    return { success: true }
  }

  async removeUser(userId: string, accessToken: string) {
    const caller = await this.supabase.verifyAndGetProfile(accessToken)

    if (
      !caller ||
      caller.profile.role !== 'admin' ||
      caller.profile.status !== 'approved'
    ) {
      throw new UnauthorizedException('Admin access required')
    }

    const db = this.supabase.getServiceClient()
    const { error: deleteError } = await db.auth.admin.deleteUser(userId)
    if (deleteError) throw new BadRequestException(deleteError.message)

    return { success: true }
  }
}
