import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { calculateProcedureGrade } from './evaluation-grading';

type InstructorDashboardResponse = {
  instructor: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    avatarUrl: string | null;
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
  profiles?: { first_name: string; last_name: string };
};

type EvaluationRow = {
  id: string;
  student_id: string;
  procedure_id: string;
  feedback: string | null;
  profiles?: { first_name: string; last_name: string };
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
  toggleSections: Array<{
    id: string;
    name: string;
    studentCount: number;
  }>;
  sectionAccess: Array<{
    sectionId: string;
    procedureId: string;
  }>;
  studentProcedures: StudentProcedureRow[];
  evaluations: EvaluationRow[];
};

const BUILT_IN_EINC_PROCEDURES = [
  {
    id: '50000000-0000-0000-0000-000000000010',
    name: 'EINC - Taking Rectal Temperature',
    category: 'Newborn Care',
    description:
      "Measurement of newborn body temperature through rectal route to assess temperature and check anal patency.",
  },
  {
    id: '50000000-0000-0000-0000-000000000007',
    name: 'EINC - Anthropometric Measurements',
    category: 'Newborn Care',
    description:
      'Anthropometric measurements step within the Early and Immediate Newborn Care workflow.',
  },
  {
    id: '50000000-0000-0000-0000-000000000008',
    name: "EINC - Crede's Prophylaxis",
    category: 'Newborn Care',
    description:
      "Application of ophthalmic ointment to prevent ophthalmia neonatorum in newborns.",
  },
  {
    id: '50000000-0000-0000-0000-000000000009',
    name: 'EINC - Infant Bath',
    category: 'Newborn Care',
    description:
      'Infant bath step within the Early and Immediate Newborn Care workflow.',
  },
] as const;

@Injectable()
export class InstructorDashboardService {
  constructor(private readonly supabase: SupabaseService) {}

  async getDashboard(accessToken: string): Promise<InstructorDashboardResponse> {
    const caller = await this.requireInstructor(accessToken);
    const db = this.supabase.getServiceClient();

    const { data: profile, error } = await db
      .from('profiles')
      .select('id, first_name, last_name, full_name, avatar_url')
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
        avatarUrl: profile.avatar_url ?? null,
      },
    };
  }

  async getMasterlist(
    accessToken: string
  ): Promise<{ sections: SectionRecord[] }> {
    await this.requireInstructor(accessToken);
    const db = this.supabase.getServiceClient();

    const { data: sectionsData, error: sectionsError } = await db
      .from('sections')
      .select(
        'id, name, semester, schedule, students(id, student_no, profiles(first_name, last_name, email, phone_number))'
      )
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

    await this.ensureBuiltInProcedures(caller.user.id);

    const [
      { data: sectionsData, error: sectionsError },
      { data: proceduresData, error: proceduresError },
    ] = await Promise.all([
      db
        .from('sections')
        .select(
          'id, name, students(id, student_no, profiles(first_name, last_name, email, phone_number))'
        )
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

    const rawToggleSections = sections.map((section) => ({
      id: section.id,
      name: section.name,
      studentCount: section.students.length,
      studentIds: section.students.map((student) => student.id),
    }));

    const allStudentIds = sections.flatMap((section) =>
      section.students.map((student) => student.id)
    );
    const toggleStudentIds = rawToggleSections.flatMap(
      (section) => section.studentIds
    );

    let studentProcedures: StudentProcedureRow[] = [];
    let evaluations: EvaluationRow[] = [];
    let sectionAccess: Array<{ sectionId: string; procedureId: string }> = [];

    if (allStudentIds.length > 0) {
      const [
        { data: spData, error: spError },
        { data: evaluationData, error: evaluationError },
      ] = await Promise.all([
        db
          .from('student_procedures')
          .select('id, student_id, procedure_id, status, notes, profiles!allowed_by(first_name, last_name)')
          .in('student_id', allStudentIds),
        db
          .from('evaluations')
          .select('id, student_id, procedure_id, feedback, profiles!instructor_id(first_name, last_name)')
          .in('student_id', allStudentIds),
      ]);

      if (spError) {
        throw new BadRequestException(spError.message);
      }

      if (evaluationError) {
        throw new BadRequestException(evaluationError.message);
      }

      studentProcedures = (spData ?? []) as StudentProcedureRow[];
      evaluations = (evaluationData ?? []) as EvaluationRow[];
    }

    if (toggleStudentIds.length > 0) {
      const { data: sectionAccessData, error: sectionAccessError } = await db
        .from('student_procedures')
        .select('student_id, procedure_id')
        .in('student_id', toggleStudentIds);

      if (sectionAccessError) {
        throw new BadRequestException(sectionAccessError.message);
      }

      const sectionIdByStudentId = new Map<string, string>();
      rawToggleSections.forEach((section) => {
        section.studentIds.forEach((studentId) => {
          sectionIdByStudentId.set(studentId, section.id);
        });
      });

      const sectionStudentCount = new Map<string, number>();
      rawToggleSections.forEach((section) => {
        sectionStudentCount.set(section.id, section.studentCount);
      });

      const coverageByPair = new Map<string, Set<string>>();
      for (const row of (sectionAccessData ?? []) as Array<{
        student_id: string;
        procedure_id: string;
      }>) {
        const sectionId = sectionIdByStudentId.get(row.student_id);
        if (!sectionId) {
          continue;
        }

        const pairKey = `${row.procedure_id}:${sectionId}`;
        const coveredStudents = coverageByPair.get(pairKey) ?? new Set<string>();
        coveredStudents.add(row.student_id);
        coverageByPair.set(pairKey, coveredStudents);
      }

      sectionAccess = [];
      for (const [pairKey, coveredStudents] of coverageByPair.entries()) {
        const [procedureId, sectionId] = pairKey.split(':');
        const expectedStudents = sectionStudentCount.get(sectionId) ?? 0;

        if (expectedStudents > 0 && coveredStudents.size === expectedStudents) {
          sectionAccess.push({ sectionId, procedureId });
        }
      }
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
      toggleSections: rawToggleSections.map((section) => ({
        id: section.id,
        name: section.name,
        studentCount: section.studentCount,
      })),
      sectionAccess,
      studentProcedures,
      evaluations,
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

  async updateProcedure(
    procedureId: string,
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
    await this.requireInstructor(accessToken);
    const db = this.supabase.getServiceClient();

    const { error } = await db
      .from('procedures')
      .update({
        name: dto.name.trim(),
        category: dto.category?.trim() || 'Clinical Procedure',
        description: dto.description?.trim() || null,
      })
      .eq('id', procedureId);

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
      const { error: deleteResourceError } = await db
        .from('procedure_resources')
        .delete()
        .eq('procedure_id', procedureId);

      if (deleteResourceError) {
        throw new BadRequestException(deleteResourceError.message);
      }

      const { error: insertResourceError } = await db
        .from('procedure_resources')
        .insert(
          resources.map((resource) => ({
            procedure_id: procedureId,
            type: resource.type,
            name: resource.name.trim(),
            url: resource.url.trim(),
          }))
        );

      if (insertResourceError) {
        throw new BadRequestException(insertResourceError.message);
      }
    }

    return { success: true, id: procedureId };
  }

  async toggleSectionAccess(
    procedureId: string,
    sectionId: string,
    accessToken: string
  ) {
    const caller = await this.requireInstructor(accessToken);
    const db = this.supabase.getServiceClient();

    await this.assertSectionExists(sectionId);

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
      .select('student_id')
      .eq('procedure_id', procedureId)
      .in('student_id', studentIds);

    if (existingRowsError) {
      throw new BadRequestException(existingRowsError.message);
    }

    const studentsWithAccess = new Set(
      (existingRows ?? []).map((row) => row.student_id)
    );
    const allStudentsHaveAccess = studentIds.every((studentId) =>
      studentsWithAccess.has(studentId)
    );

    if (allStudentsHaveAccess) {
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
        allowed_by: caller.user.id,
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
    await this.requireInstructor(accessToken);
    const db = this.supabase.getServiceClient();

    await Promise.all([
      this.assertStudentExists(dto.studentId),
      this.assertProcedureExists(dto.procedureId),
      this.assertStudentProcedureAssigned(dto.studentId, dto.procedureId),
    ]);

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

    await Promise.all([
      this.assertStudentExists(dto.studentId),
      this.assertProcedureExists(dto.procedureId),
      this.assertStudentProcedureAssigned(dto.studentId, dto.procedureId),
    ]);

    const procedureName = await this.getProcedureName(dto.procedureId);
    const { grade: score } = calculateProcedureGrade(
      procedureName,
      dto.evaluations ?? {}
    );
    const competencyStatus =
      score === null ? null : score >= 75 ? 'Competent' : 'Not Yet Competent';

    const { data: existingEvaluations, error: existingEvaluationsError } = await db
      .from('evaluations')
      .select('id')
      .eq('student_id', dto.studentId)
      .eq('procedure_id', dto.procedureId)
      .order('evaluation_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (existingEvaluationsError) {
      throw new BadRequestException(existingEvaluationsError.message);
    }

    const nowIso = new Date().toISOString();
    const evaluationPayload = {
      student_id: dto.studentId,
      procedure_id: dto.procedureId,
      instructor_id: caller.user.id,
      overall_score: score,
      max_score: 100,
      competency_status: competencyStatus,
      feedback: dto.feedback?.trim() || '',
      evaluation_date: nowIso,
    };

    const latestEvaluation = (existingEvaluations ?? [])[0];
    const { error: evaluationError } = latestEvaluation
      ? await db
          .from('evaluations')
          .update({
            instructor_id: evaluationPayload.instructor_id,
            overall_score: evaluationPayload.overall_score,
            max_score: evaluationPayload.max_score,
            competency_status: evaluationPayload.competency_status,
            feedback: evaluationPayload.feedback,
            evaluation_date: evaluationPayload.evaluation_date,
          })
          .eq('id', latestEvaluation.id)
      : await db.from('evaluations').insert(evaluationPayload);

    if (evaluationError) {
      throw new BadRequestException(evaluationError.message);
    }

    if ((existingEvaluations?.length ?? 0) > 1) {
      const staleEvaluationIds = existingEvaluations!.slice(1).map((row) => row.id);

      const { error: deleteDuplicateError } = await db
        .from('evaluations')
        .delete()
        .in('id', staleEvaluationIds);

      if (deleteDuplicateError) {
        throw new BadRequestException(deleteDuplicateError.message);
      }
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

  private async assertSectionExists(sectionId: string) {
    const db = this.supabase.getServiceClient();
    const { data, error } = await db
      .from('sections')
      .select('id')
      .eq('id', sectionId)
      .maybeSingle();

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!data) {
      throw new NotFoundException('Section not found');
    }
  }

  private async getProcedureName(procedureId: string) {
    const db = this.supabase.getServiceClient();
    const { data, error } = await db
      .from('procedures')
      .select('name')
      .eq('id', procedureId)
      .maybeSingle();

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!data?.name) {
      throw new NotFoundException('Procedure not found');
    }

    return data.name;
  }

  private async assertStudentExists(studentId: string) {
    const db = this.supabase.getServiceClient();
    const { data, error } = await db
      .from('students')
      .select('id')
      .eq('id', studentId)
      .maybeSingle();

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!data) {
      throw new NotFoundException('Student not found');
    }
  }

  private async assertProcedureExists(procedureId: string) {
    const db = this.supabase.getServiceClient();
    const { data, error } = await db
      .from('procedures')
      .select('id')
      .eq('id', procedureId)
      .maybeSingle();

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!data) {
      throw new NotFoundException('Procedure not found');
    }
  }

  private async assertStudentProcedureAssigned(
    studentId: string,
    procedureId: string
  ) {
    const db = this.supabase.getServiceClient();
    const { data, error } = await db
      .from('student_procedures')
      .select('id')
      .eq('student_id', studentId)
      .eq('procedure_id', procedureId)
      .maybeSingle();

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!data) {
      throw new BadRequestException(
        'Procedure is locked for this student. Unlock it before saving notes or evaluation.'
      );
    }
  }

  private async ensureBuiltInProcedures(createdBy: string) {
    const db = this.supabase.getServiceClient();

    const { data: procedures, error } = await db
      .from('procedures')
      .select('id, name');

    if (error) {
      throw new BadRequestException(error.message);
    }

    const existingIds = new Set(
      ((procedures ?? []) as Array<{ id: string }>).map((procedure) => procedure.id)
    );
    const existingNames = new Set(
      ((procedures ?? []) as Array<{ name: string }>).map((procedure) => procedure.name)
    );

    const missingProcedures = BUILT_IN_EINC_PROCEDURES.filter(
      (procedure) =>
        !existingIds.has(procedure.id) && !existingNames.has(procedure.name)
    );

    if (missingProcedures.length === 0) {
      return;
    }

    const { error: insertError } = await db.from('procedures').insert(
      missingProcedures.map((procedure) => ({
        id: procedure.id,
        name: procedure.name,
        category: procedure.category,
        description: procedure.description,
        created_by: createdBy,
      }))
    );

    if (insertError) {
      throw new BadRequestException(insertError.message);
    }
  }

  private asArray<T>(value: T | T[] | null | undefined): T[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }
}
