import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
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
      const studentNoRegex = /^NSG-\d{4}-\d{5}$/;
      if (!studentNoRegex.test(dto.studentNo)) {
        throw new BadRequestException('Student ID must follow the format NSG-0000-00000 (digits only)');
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
        email_verified: false,
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

        await this.syncStudentProceduresFromSection(userId, resolvedSectionId)
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

    // Fetch profile details first
    const { data: profile, error } = await db
      .from('profiles')
      .select('first_name, last_name, email, role, status')
      .eq('id', dto.userId)
      .single()

    if (error || !profile) {
      throw new BadRequestException(error?.message ?? 'Profile not found')
    }

    const appUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000'
    const userName = `${profile.first_name} ${profile.last_name}`.trim();
    const roleLabel = profile.role === 'instructor' ? 'Clinical Instructor' : 'Nursing Student'

    if (dto.action === ApproveAction.APPROVE) {
      if (profile.status !== 'pending') {
        throw new BadRequestException('Only pending users can be approved.')
      }

      const verificationToken = randomUUID()

      const { error: updateError } = await db
        .from('profiles')
        .update({ status: 'approved', verification_token: verificationToken })
        .eq('id', dto.userId)

      if (updateError) throw new BadRequestException(updateError.message)

      const verifyUrl = `${appUrl}/verify?token=${verificationToken}`

      try {
        await this.email.sendEmail(
          profile.email,
          'Your Maternix Track account is approved - verify your email',
          accountApprovedEmail({ userName, verifyUrl, roleLabel }),
          'approved'
        )
      } catch (err) {
        await db
          .from('profiles')
          .update({ status: 'pending', verification_token: null })
          .eq('id', dto.userId)

        throw new BadRequestException(
          err instanceof Error
            ? err.message
            : 'Approval email failed. Approval was reverted to pending.'
        )
      }

      return { success: true, emailStatus: 'sent' }
    }

    const { error: deleteError } = await db.auth.admin.deleteUser(dto.userId)
    if (deleteError) throw new BadRequestException(deleteError.message)

    this.email
      .sendEmail(
        profile.email,
        'Maternix Track - Account update',
        accountRejectedEmail({ userName, reason: dto.reason }),
        'rejected'
      )
      .catch((err) => console.warn('Rejection email failed (non-fatal):', err?.message ?? err))

    return { success: true, emailStatus: 'queued' }
  }

  async verifyEmail(token: string) {
    if (!token) throw new BadRequestException('Verification token is required')

    const db = this.supabase.getServiceClient()

    const { data: profile, error } = await db
      .from('profiles')
      .select('id, status, email_verified')
      .eq('verification_token', token)
      .single()

    if (error || !profile) {
      throw new BadRequestException('Invalid or expired verification link.')
    }

    if (profile.status !== 'approved') {
      throw new BadRequestException('Account is not approved.')
    }

    if (profile.email_verified) {
      // Already verified — idempotent success
      return { success: true, alreadyVerified: true }
    }

    const { error: updateError } = await db
      .from('profiles')
      .update({ email_verified: true, verification_token: null })
      .eq('id', profile.id)

    if (updateError) throw new BadRequestException(updateError.message)

    return { success: true, alreadyVerified: false }
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

  private async syncStudentProceduresFromSection(
    studentId: string,
    sectionId: string | null
  ) {
    if (!sectionId) return

    const db = this.supabase.getServiceClient()

    const { data: sectionStudents, error: sectionStudentsError } = await db
      .from('students')
      .select('id')
      .eq('section_id', sectionId)

    if (sectionStudentsError) throw sectionStudentsError

    const peerStudentIds = (sectionStudents ?? [])
      .map((student) => student.id)
      .filter((id) => id !== studentId)

    if (peerStudentIds.length === 0) return

    const { data: procedureRows, error: procedureRowsError } = await db
      .from('student_procedures')
      .select('procedure_id')
      .in('student_id', peerStudentIds)

    if (procedureRowsError) throw procedureRowsError

    const sectionProcedureIds = [...new Set((procedureRows ?? []).map((row) => row.procedure_id))]
    if (sectionProcedureIds.length === 0) return

    const { error: insertError } = await db.from('student_procedures').upsert(
      sectionProcedureIds.map((procedureId) => ({
        student_id: studentId,
        procedure_id: procedureId,
        status: 'pending',
        notes: null,
      })),
      { onConflict: 'student_id,procedure_id', ignoreDuplicates: true }
    )

    if (insertError) throw insertError
  }
}
