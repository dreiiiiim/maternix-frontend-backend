import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { EmailService } from '../email/email.service';
import { announcementEmail } from '../email/email.templates';

type AnnouncementRow = {
  title: string
  content: string
  category: string
  target_role: 'student' | 'instructor' | 'all'
  profiles: { full_name: string } | null
}

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly email: EmailService
  ) {}

  async getMyAnnouncements(accessToken: string) {
    const caller = await this.supabase.verifyAndGetProfile(accessToken)

    if (
      !caller ||
      caller.profile.status !== 'approved' ||
      !['instructor', 'admin'].includes(caller.profile.role)
    ) {
      throw new UnauthorizedException('Instructor or admin access required')
    }

    const db = this.supabase.getServiceClient()
    const { data, error } = await db
      .from('announcements')
      .select('id, title, category, created_at')
      .eq('created_by', caller.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new BadRequestException(error.message)
    }

    return { announcements: data ?? [] }
  }

  async createAnnouncement(
    dto: { title: string; content: string; category?: string },
    accessToken: string
  ) {
    const caller = await this.supabase.verifyAndGetProfile(accessToken)

    if (
      !caller ||
      caller.profile.status !== 'approved' ||
      !['instructor', 'admin'].includes(caller.profile.role)
    ) {
      throw new UnauthorizedException('Instructor or admin access required')
    }

    const db = this.supabase.getServiceClient()
    const { data, error } = await db
      .from('announcements')
      .insert({
        title: dto.title.trim(),
        content: dto.content.trim(),
        category: dto.category?.trim() || 'Academic',
        target_role: 'student',
        created_by: caller.user.id,
      })
      .select('id')
      .single()

    if (error) {
      throw new BadRequestException(error.message)
    }

    return { success: true, id: data.id }
  }

  async deleteAnnouncement(id: string, accessToken: string) {
    const caller = await this.supabase.verifyAndGetProfile(accessToken)

    if (
      !caller ||
      caller.profile.status !== 'approved' ||
      !['instructor', 'admin'].includes(caller.profile.role)
    ) {
      throw new UnauthorizedException('Instructor or admin access required')
    }

    const db = this.supabase.getServiceClient()
    const { error } = await db
      .from('announcements')
      .delete()
      .eq('id', id)
      .eq('created_by', caller.user.id)

    if (error) {
      throw new BadRequestException(error.message)
    }

    return { success: true }
  }

  async sendAnnouncementEmail(announcementId: string, accessToken: string) {
    const caller = await this.supabase.verifyAndGetProfile(accessToken)

    if (
      !caller ||
      caller.profile.status !== 'approved' ||
      !['instructor', 'admin'].includes(caller.profile.role)
    ) {
      throw new UnauthorizedException('Instructor or admin access required')
    }

    const db = this.supabase.getServiceClient()

    const { data: ann } = await db
      .from('announcements')
      .select('title, content, category, target_role, profiles(full_name)')
      .eq('id', announcementId)
      .single()

    if (!ann) throw new NotFoundException('Announcement not found')
    const announcement = ann as unknown as AnnouncementRow

    const targetRoles =
      announcement.target_role === 'all'
        ? ['student', 'instructor']
        : [announcement.target_role]

    const { data: recipients } = await db
      .from('profiles')
      .select('email')
      .eq('status', 'approved')
      .in('role', targetRoles)

    const instructorName = announcement.profiles?.full_name ?? 'Maternix'

    await Promise.allSettled(
      (recipients ?? []).map((recipient) =>
        this.email.sendEmail(
          recipient.email,
          announcement.title,
          announcementEmail({
            title: announcement.title,
            content: announcement.content,
            category: announcement.category,
            instructorName,
          }),
          'announcement'
        )
      )
    )

    return { success: true }
  }
}
