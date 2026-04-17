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

  async signup(dto: SignupDto) {
    if (dto.role === SignupRole.STUDENT && (!dto.studentNo || !dto.section)) {
      throw new BadRequestException(
        'studentNo and section are required for student role'
      )
    }

    if (
      dto.role === SignupRole.INSTRUCTOR &&
      (!dto.employeeId || !dto.department)
    ) {
      throw new BadRequestException(
        'employeeId and department are required for instructor role'
      )
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

    const { error: profileError } = await db.from('profiles').insert({
      id: userId,
      full_name: dto.fullName,
      email: dto.email,
      role: dto.role,
      status: 'pending',
    })

    if (profileError) {
      await db.auth.admin.deleteUser(userId)
      throw new BadRequestException(profileError.message)
    }

    try {
      if (dto.role === SignupRole.STUDENT) {
        const { data: sectionRow } = await db
          .from('sections')
          .select('id')
          .eq('name', dto.section!)
          .single()

        const { error: studentError } = await db.from('students').insert({
          id: userId,
          student_no: dto.studentNo!,
          section_id: sectionRow?.id ?? null,
        })

        if (studentError) throw studentError
      } else if (dto.role === SignupRole.INSTRUCTOR) {
        const { error: instructorError } = await db.from('instructors').insert({
          id: userId,
          employee_id: dto.employeeId!,
          department: dto.department!,
        })

        if (instructorError) throw instructorError
      }
    } catch (error) {
      await db.from('profiles').delete().eq('id', userId)
      await db.auth.admin.deleteUser(userId)
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error)
      )
    }

    await this.email.sendEmail(
      this.config.get<string>('ADMIN_EMAIL')!,
      `New registration request - ${dto.fullName}`,
      signupPendingAdminEmail({
        userName: dto.fullName,
        userEmail: dto.email,
        role: dto.role,
        requestedDate: new Date().toLocaleString(),
      }),
      'signup_pending'
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
    const newStatus = dto.action === ApproveAction.APPROVE ? 'approved' : 'rejected'

    const { data: profile, error } = await db
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', dto.userId)
      .select('full_name, email')
      .single()

    if (error || !profile) {
      throw new BadRequestException(error?.message ?? 'Profile not found')
    }

    const appUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000'

    if (dto.action === ApproveAction.APPROVE) {
      await this.email.sendEmail(
        profile.email,
        'Your Maternix Track account is approved',
        accountApprovedEmail({ userName: profile.full_name, appUrl }),
        'approved'
      )
    } else {
      await this.email.sendEmail(
        profile.email,
        'Maternix Track - Account update',
        accountRejectedEmail({ userName: profile.full_name, reason: dto.reason }),
        'rejected'
      )
    }

    return { success: true }
  }
}
