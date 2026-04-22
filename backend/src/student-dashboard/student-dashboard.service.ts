import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';

type StudentDashboardResponse = {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    role: string;
    avatarUrl: string | null;
  };
  stats: {
    totalAllowed: number;
    evaluated: number;
    inProgress: number;
    completed: number;
    locked: number;
  };
  procedures: Array<{
    id: string;
    procedureId: string;
    name: string;
    category: string;
    description: string | null;
    allowedBy: string | null;
    allowedDate: string | null;
    status: 'pending' | 'in_progress' | 'completed' | 'evaluated' | 'locked';
    completedDate: string | null;
    notes: string | null;
    evaluation: {
      overallScore: number | null;
      maxScore: number | null;
      competencyStatus: string | null;
      evaluationDate: string | null;
      evaluatorName: string | null;
      feedback: string | null;
      rubric: Array<{
        criterion: string;
        score: number;
        maxScore: number;
        description: string;
      }>;
    } | null;
    resources: Array<{
      type: 'file' | 'link';
      name: string;
      url: string;
    }>;
  }>;
  announcements: Array<{
    id: string;
    title: string;
    instructor: string;
    role: string;
    date: string;
    content: string;
    category: string;
  }>;
};

@Injectable()
export class StudentDashboardService {
  constructor(private readonly supabase: SupabaseService) {}

  async getProfile(accessToken: string) {
    const caller = await this.requireApprovedStudent(accessToken);
    const db = this.supabase.getServiceClient();

    const [{ data: profile, error: profileError }, { data: student, error: studentError }] =
      await Promise.all([
        db
          .from('profiles')
          .select(
            'id, first_name, last_name, full_name, email, phone_number, avatar_url, created_at'
          )
          .eq('id', caller.user.id)
          .single(),
        db
          .from('students')
          .select('student_no, year_level, sections(name)')
          .eq('id', caller.user.id)
          .single(),
      ]);

    const firstError = profileError ?? studentError;
    if (firstError) {
      throw new BadRequestException(firstError.message);
    }

    if (!profile || !student) {
      throw new BadRequestException('Profile not found');
    }

    const section = this.asArray((student as any).sections)[0];

    return {
      profile: {
        id: profile.id,
        firstName: profile.first_name ?? '',
        lastName: profile.last_name ?? '',
        fullName:
          profile.full_name ??
          `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim(),
        email: profile.email,
        phone: profile.phone_number ?? '',
        avatarUrl: profile.avatar_url ?? null,
        createdAt: profile.created_at,
      },
      student: {
        studentNo: (student as any).student_no ?? '',
        yearLevel: (student as any).year_level ?? '',
        section: section?.name ?? '',
      },
    };
  }

  async updateProfile(accessToken: string, body: UpdateStudentProfileDto) {
    const caller = await this.requireApprovedStudent(accessToken);
    const db = this.supabase.getServiceClient();

    const { data: existing, error: existingError } = await db
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', caller.user.id)
      .single();

    if (existingError || !existing) {
      throw new BadRequestException(
        existingError?.message ?? 'Profile not found'
      );
    }

    const resolvedFirstName = (body.firstName ?? existing.first_name ?? '').trim();
    const resolvedLastName = (body.lastName ?? existing.last_name ?? '').trim();

    if (!resolvedFirstName || !resolvedLastName) {
      throw new BadRequestException('First name and last name are required.');
    }

    const updatePayload: Record<string, string | null> = {
      first_name: resolvedFirstName,
      last_name: resolvedLastName,
      full_name: `${resolvedFirstName} ${resolvedLastName}`.trim(),
    };

    if (body.phone !== undefined) {
      updatePayload.phone_number = body.phone.trim();
    }

    if (body.avatarUrl !== undefined) {
      updatePayload.avatar_url = body.avatarUrl?.trim() || null;
    }

    const { error: updateError } = await db
      .from('profiles')
      .update(updatePayload)
      .eq('id', caller.user.id);

    if (updateError) {
      throw new BadRequestException(updateError.message);
    }

    return this.getProfile(accessToken);
  }

  async getDashboard(accessToken: string): Promise<StudentDashboardResponse> {
    const caller = await this.requireApprovedStudent(accessToken);

    const db = this.supabase.getServiceClient();
    const userId = caller.user.id;

    const [{ data: profile, error: profileError }, { data: procedures, error: proceduresError }, { data: studentProcedures, error: studentProceduresError }, { data: evaluations, error: evaluationsError }, { data: announcements, error: announcementsError }] =
      await Promise.all([
        db
          .from('profiles')
          .select('id, first_name, last_name, full_name, role, avatar_url')
          .eq('id', userId)
          .single(),
        db
          .from('procedures')
          .select(
            'id, name, category, description, profiles!created_by(first_name, last_name), procedure_resources(type, name, url)'
          )
          .order('created_at', { ascending: false }),
        db
          .from('student_procedures')
          .select(
            'id, procedure_id, status, notes, completed_at, created_at'
          )
          .eq('student_id', userId),
        db
          .from('evaluations')
          .select(
            'procedure_id, overall_score, max_score, competency_status, feedback, evaluation_date, profiles!instructor_id(first_name, last_name)'
          )
          .eq('student_id', userId),
        db
          .from('announcements')
          .select(
            'id, title, content, category, created_at, profiles!announcements_created_by_fkey(first_name, last_name, role)'
          )
          .or('target_role.eq.all,target_role.eq.student')
          .order('created_at', { ascending: false }),
      ]);

    const firstError =
      profileError ??
      proceduresError ??
      studentProceduresError ??
      evaluationsError ??
      announcementsError;

    if (firstError) {
      throw new BadRequestException(firstError.message);
    }

    if (!profile) {
      throw new BadRequestException('Student profile not found');
    }

    const evalMap = new Map<
      string,
      StudentDashboardResponse['procedures'][number]['evaluation']
    >();

    for (const evaluation of (evaluations ?? []) as any[]) {
      const evaluator = this.asArray(evaluation.profiles)[0];
      const evaluatorName = evaluator
        ? `${evaluator.first_name ?? ''} ${evaluator.last_name ?? ''}`.trim()
        : null;

      evalMap.set(evaluation.procedure_id, {
        overallScore:
          evaluation.overall_score === null
            ? null
            : Number(evaluation.overall_score),
        maxScore:
          evaluation.max_score === null ? null : Number(evaluation.max_score),
        competencyStatus: evaluation.competency_status ?? null,
        evaluationDate: this.formatDate(evaluation.evaluation_date),
        evaluatorName: evaluatorName || null,
        feedback: evaluation.feedback ?? null,
        rubric: [],
      });
    }

    const assignedMap = new Map<string, any>();
    for (const row of (studentProcedures ?? []) as any[]) {
      assignedMap.set(row.procedure_id, row);
    }

    const mappedProcedures = ((procedures ?? []) as any[]).map((procedure) => {
      const assigned = assignedMap.get(procedure.id);
      const creator = this.asArray(procedure.profiles)[0];
      const creatorName = creator
        ? `${creator.first_name ?? ''} ${creator.last_name ?? ''}`.trim()
        : null;

      return {
        id: assigned?.id ?? `locked-${procedure.id}`,
        procedureId: procedure.id,
        name: procedure.name,
        category: procedure.category ?? 'Clinical Procedure',
        description: procedure.description ?? null,
        allowedBy: creatorName || null,
        allowedDate: assigned ? this.formatDate(assigned.created_at) : null,
        status: (assigned?.status ?? 'locked') as
          | 'pending'
          | 'in_progress'
          | 'completed'
          | 'evaluated'
          | 'locked',
        completedDate: assigned
          ? this.formatDate(assigned.completed_at)
          : null,
        notes: assigned?.notes ?? null,
        evaluation: evalMap.get(procedure.id) ?? null,
        resources: this.asArray(procedure.procedure_resources).map((resource: any) => ({
          type: resource.type as 'file' | 'link',
          name: resource.name as string,
          url: resource.url as string,
        })),
      };
    });

    const stats = {
      totalAllowed: mappedProcedures.filter((item) => item.status !== 'locked')
        .length,
      evaluated: mappedProcedures.filter((item) => item.status === 'evaluated')
        .length,
      inProgress: mappedProcedures.filter((item) =>
        ['pending', 'in_progress'].includes(item.status)
      ).length,
      completed: mappedProcedures.filter((item) => item.status === 'completed')
        .length,
      locked: mappedProcedures.filter((item) => item.status === 'locked').length,
    };

    const mappedAnnouncements = ((announcements ?? []) as any[]).map((row) => {
      const creator = this.asArray(row.profiles)[0];
      const name = creator
        ? `${creator.first_name ?? ''} ${creator.last_name ?? ''}`.trim()
        : '';

      return {
        id: row.id,
        title: row.title,
        instructor: name || 'Maternix',
        role: creator?.role ?? 'instructor',
        date: this.formatDate(row.created_at) ?? '',
        content: row.content,
        category: row.category,
      };
    });

    return {
      student: {
        id: profile.id,
        firstName: profile.first_name ?? '',
        lastName: profile.last_name ?? '',
        fullName:
          profile.full_name ??
          `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim(),
        role: profile.role,
        avatarUrl: profile.avatar_url ?? null,
      },
      stats,
      procedures: mappedProcedures,
      announcements: mappedAnnouncements,
    };
  }

  private asArray<T>(value: T | T[] | null | undefined): T[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  private formatDate(iso: string | null | undefined): string | null {
    return iso
      ? new Date(iso).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : null;
  }

  private async requireApprovedStudent(accessToken: string) {
    const caller = await this.supabase.verifyAndGetProfile(accessToken);

    if (
      !caller ||
      caller.profile.role !== 'student' ||
      caller.profile.status !== 'approved'
    ) {
      throw new UnauthorizedException('Approved student access required');
    }

    return caller;
  }
}
