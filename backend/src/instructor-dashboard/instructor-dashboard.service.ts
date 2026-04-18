import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

type InstructorDashboardResponse = {
  instructor: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
  };
};

type StudentRecord = {
  id: string;
  studentNo: string;
  name: string;
  email: string;
  phone: string;
  completedProcedures: number;
  totalProcedures: number;
};

type SectionRecord = {
  id: string;
  name: string;
  semester: string;
  schedule: string;
  students: StudentRecord[];
};

type StudentProcedureRow = {
  id: string;
  student_id: string;
  procedure_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'evaluated';
  notes: string | null;
};

type ProcedureRecord = {
  id: string;
  name: string;
  category: string;
  description: string;
  resources: Array<{
    type: 'file' | 'link';
    name: string;
    url: string;
  }>;
};

type ProcedureDashboardResponse = {
  procedures: ProcedureRecord[];
  sections: Array<{
    id: string;
    name: string;
    students: Array<{
      id: string;
      studentNo: string;
      name: string;
      email: string;
      phone: string;
    }>;
  }>;
  studentProcedures: StudentProcedureRow[];
};

@Injectable()
export class InstructorDashboardService {
  constructor(private readonly supabase: SupabaseService) {}

  async getDashboard(accessToken: string): Promise<InstructorDashboardResponse> {
    const caller = await this.requireInstructor(accessToken);
    const db = this.supabase.getServiceClient();

    const { data: profile, error } = await db
      .from('profiles')
      .select('id, first_name, last_name, full_name')
      .eq('id', caller.user.id)
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!profile) {
      throw new NotFoundException('Instructor profile not found');
    }

    return {
      instructor: {
        id: profile.id,
        firstName: profile.first_name ?? '',
        lastName: profile.last_name ?? '',
        fullName:
          profile.full_name ??
          `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim(),
      },
    };
  }

  async getMasterlist(
    accessToken: string
  ): Promise<{ sections: SectionRecord[] }> {
    const caller = await this.requireInstructor(accessToken);
    const db = this.supabase.getServiceClient();

    const { data: sectionsData, error: sectionsError } = await db
      .from('sections')
      .select(
        'id, name, semester, schedule, students(id, student_no, profiles(first_name, last_name, email, phone_number))'
      )
      .eq('instructor_id', caller.user.id)
      .order('name', { ascending: true });

    if (sectionsError) {
      throw new BadRequestException(sectionsError.message);
    }

    const rawSections = ((sectionsData ?? []) as any[]).map((section) => ({
      ...section,
      students: this.asArray(section.students),
    }));

    const allStudentIds = rawSections.flatMap((section) =>
      section.students.map((student: any) => student.id)
    );

    let statusRows: Array<{
      student_id: string;
      status: 'pending' | 'in_progress' | 'completed' | 'evaluated';
    }> = [];

    if (allStudentIds.length > 0) {
      const { data: spData, error: spError } = await db
        .from('student_procedures')
        .select('student_id, status')
        .in('student_id', allStudentIds);

      if (spError) {
        throw new BadRequestException(spError.message);
      }

      statusRows = (spData ?? []) as typeof statusRows;
    }

    return {
      sections: rawSections.map((section) => ({
        id: section.id,
        name: section.name,
        semester: section.semester,
        schedule: section.schedule ?? 'No schedule',
        students: section.students.map((student: any) => {
          const profile = this.asArray(student.profiles)[0];
          const studentStatuses = statusRows.filter(
            (row) => row.student_id === student.id
          );
          const totalProcedures = studentStatuses.length;
          const completedProcedures = studentStatuses.filter((row) =>
            ['completed', 'evaluated'].includes(row.status)
          ).length;

          return {
            id: student.id,
            studentNo: student.student_no,
            name:
              `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() ||
              'Unnamed student',
            email: profile?.email ?? 'No email',
            phone: profile?.phone_number ?? 'No phone number',
            completedProcedures,
            totalProcedures,
          };
        }),
      })),
    };
  }

  async getProcedures(accessToken: string): Promise<ProcedureDashboardResponse> {
    const caller = await this.requireInstructor(accessToken);
    const db = this.supabase.getServiceClient();

    const [
      { data: sectionsData, error: sectionsError },
      { data: proceduresData, error: proceduresError },
    ] = await Promise.all([
      db
        .from('sections')
        .select(
          'id, name, students(id, student_no, profiles(first_name, last_name, email, phone_number))'
        )
        .eq('instructor_id', caller.user.id)
        .order('name', { ascending: true }),
      db
        .from('procedures')
        .select(
          'id, name, category, description, procedure_resources(type, name, url)'
        )
        .order('created_at', { ascending: false }),
    ]);

    const firstError = sectionsError ?? proceduresError;
    if (firstError) {
      throw new BadRequestException(firstError.message);
    }

    const sections = ((sectionsData ?? []) as any[]).map((section) => ({
      id: section.id,
      name: section.name,
      students: this.asArray(section.students).map((student: any) => {
        const profile = this.asArray(student.profiles)[0];

        return {
          id: student.id,
          studentNo: student.student_no,
          name:
            `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() ||
            'Unnamed student',
          email: profile?.email ?? 'No email',
          phone: profile?.phone_number ?? 'No phone number',
        };
      }),
    }));

    const allStudentIds = sections.flatMap((section) =>
      section.students.map((student) => student.id)
    );

    let studentProcedures: StudentProcedureRow[] = [];

    if (allStudentIds.length > 0) {
      const { data: spData, error: spError } = await db
        .from('student_procedures')
        .select('id, student_id, procedure_id, status, notes')
        .in('student_id', allStudentIds);

      if (spError) {
        throw new BadRequestException(spError.message);
      }

      studentProcedures = (spData ?? []) as StudentProcedureRow[];
    }

    return {
      procedures: ((proceduresData ?? []) as any[]).map((procedure) => ({
        id: procedure.id,
        name: procedure.name,
        category: procedure.category,
        description: procedure.description ?? '',
        resources: this.asArray(procedure.procedure_resources).map((resource: any) => ({
          type: resource.type as 'file' | 'link',
          name: resource.name as string,
          url: resource.url as string,
        })),
      })),
      sections,
      studentProcedures,
    };
  }

  async addProcedure(
    dto: {
      name: string;
      category?: string;
      description?: string;
      resources?: Array<{
        type?: 'file' | 'link';
        name?: string;
        url?: string;
      }>;
    },
    accessToken: string
  ) {
    const caller = await this.requireInstructor(accessToken);
    const db = this.supabase.getServiceClient();

    const { data, error } = await db
      .from('procedures')
      .insert({
        name: dto.name.trim(),
        category: dto.category?.trim() || 'Clinical Procedure',
        description: dto.description?.trim() || null,
        created_by: caller.user.id,
      })
      .select('id')
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    const resources = (dto.resources ?? []).filter(
      (resource): resource is { type: 'file' | 'link'; name: string; url: string } =>
        (resource.type === 'file' || resource.type === 'link') &&
        Boolean(resource.name?.trim()) &&
        Boolean(resource.url?.trim())
    );

    if (resources.length > 0) {
      const { error: resourceError } = await db
        .from('procedure_resources')
        .insert(
          resources.map((resource) => ({
            procedure_id: data.id,
            type: resource.type,
            name: resource.name.trim(),
            url: resource.url.trim(),
          }))
        );

      if (resourceError) {
        throw new BadRequestException(resourceError.message);
      }
    }

    return { success: true, id: data.id };
  }

  async toggleSectionAccess(
    procedureId: string,
    sectionId: string,
    accessToken: string
  ) {
    const caller = await this.requireInstructor(accessToken);
    const db = this.supabase.getServiceClient();

    await this.assertInstructorOwnsSection(sectionId, caller.user.id);

    const { data: students, error: studentsError } = await db
      .from('students')
      .select('id')
      .eq('section_id', sectionId);

    if (studentsError) {
      throw new BadRequestException(studentsError.message);
    }

    const studentIds = (students ?? []).map((student) => student.id);
    if (studentIds.length === 0) {
      return { success: true, enabled: false };
    }

    const { data: existingRows, error: existingRowsError } = await db
      .from('student_procedures')
      .select('id')
      .eq('procedure_id', procedureId)
      .in('student_id', studentIds);

    if (existingRowsError) {
      throw new BadRequestException(existingRowsError.message);
    }

    const hasAccess = (existingRows ?? []).length > 0;

    if (hasAccess) {
      const { error } = await db
        .from('student_procedures')
        .delete()
        .eq('procedure_id', procedureId)
        .in('student_id', studentIds);

      if (error) {
        throw new BadRequestException(error.message);
      }

      return { success: true, enabled: false };
    }

    const { error } = await db.from('student_procedures').upsert(
      studentIds.map((studentId) => ({
        student_id: studentId,
        procedure_id: procedureId,
        status: 'pending',
      })),
      { onConflict: 'student_id,procedure_id', ignoreDuplicates: true }
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { success: true, enabled: true };
  }

  async updateStudentProcedureNote(
    dto: { studentId: string; procedureId: string; notes?: string },
    accessToken: string
  ) {
    const caller = await this.requireInstructor(accessToken);
    const db = this.supabase.getServiceClient();

    await this.assertInstructorOwnsStudent(dto.studentId, caller.user.id);

    const { error } = await db
      .from('student_procedures')
      .update({ notes: dto.notes?.trim() || null })
      .eq('student_id', dto.studentId)
      .eq('procedure_id', dto.procedureId);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { success: true };
  }

  async saveEvaluation(
    dto: {
      studentId: string;
      procedureId: string;
      evaluations?: Record<string, 'performed' | 'not-performed' | null>;
      feedback?: string;
    },
    accessToken: string
  ) {
    const caller = await this.requireInstructor(accessToken);
    const db = this.supabase.getServiceClient();

    await this.assertInstructorOwnsStudent(dto.studentId, caller.user.id);

    const values = Object.values(dto.evaluations ?? {}).filter(
      (value): value is 'performed' | 'not-performed' =>
        value === 'performed' || value === 'not-performed'
    );
    const performed = values.filter((value) => value === 'performed').length;
    const score = values.length
      ? Number(((performed / values.length) * 100).toFixed(2))
      : null;
    const competencyStatus =
      score === null ? null : score >= 75 ? 'Competent' : 'Not Yet Competent';

    const { error: evaluationError } = await db.from('evaluations').insert({
      student_id: dto.studentId,
      procedure_id: dto.procedureId,
      instructor_id: caller.user.id,
      overall_score: score,
      max_score: 100,
      competency_status: competencyStatus,
      feedback: dto.feedback?.trim() || '',
    });

    if (evaluationError) {
      throw new BadRequestException(evaluationError.message);
    }

    const { error: studentProcedureError } = await db
      .from('student_procedures')
      .update({ status: 'evaluated' })
      .eq('student_id', dto.studentId)
      .eq('procedure_id', dto.procedureId);

    if (studentProcedureError) {
      throw new BadRequestException(studentProcedureError.message);
    }

    return { success: true };
  }

  private async requireInstructor(accessToken: string) {
    const caller = await this.supabase.verifyAndGetProfile(accessToken);

    if (
      !caller ||
      caller.profile.role !== 'instructor' ||
      caller.profile.status !== 'approved'
    ) {
      throw new UnauthorizedException('Approved instructor access required');
    }

    return caller;
  }

  private async assertInstructorOwnsSection(
    sectionId: string,
    instructorId: string
  ) {
    const db = this.supabase.getServiceClient();
    const { data, error } = await db
      .from('sections')
      .select('id')
      .eq('id', sectionId)
      .eq('instructor_id', instructorId)
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!data) {
      throw new UnauthorizedException('Section access denied');
    }
  }

  private async assertInstructorOwnsStudent(
    studentId: string,
    instructorId: string
  ) {
    const db = this.supabase.getServiceClient();
    const { data, error } = await db
      .from('students')
      .select('id, section_id, sections!inner(instructor_id)')
      .eq('id', studentId)
      .eq('sections.instructor_id', instructorId)
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!data) {
      throw new UnauthorizedException('Student access denied');
    }
  }

  private asArray<T>(value: T | T[] | null | undefined): T[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }
}
