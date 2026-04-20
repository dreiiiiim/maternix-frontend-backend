import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AdminService {
  constructor(private readonly supabase: SupabaseService) {}

  async moveStudent(
    studentId: string,
    targetSectionId: string,
    accessToken: string
  ) {
    await this.requireAdmin(accessToken);
    const db = this.supabase.getServiceClient();

    const targetProcedureIds = await this.getTargetSectionProcedureIds(
      targetSectionId,
      studentId
    );

    const { error: updateStudentError } = await db
      .from('students')
      .update({ section_id: targetSectionId })
      .eq('id', studentId);

    if (updateStudentError) {
      throw new BadRequestException(updateStudentError.message);
    }

    await this.replaceStudentProcedures(studentId, targetProcedureIds);

    return { success: true };
  }

  async bulkAssignStudents(
    studentIds: string[],
    targetSectionId: string,
    accessToken: string
  ) {
    await this.requireAdmin(accessToken);
    const db = this.supabase.getServiceClient();

    const uniqueStudentIds = [...new Set(studentIds.filter(Boolean))];
    if (uniqueStudentIds.length === 0) {
      throw new BadRequestException('studentIds are required');
    }

    const targetProcedureIds = await this.getTargetSectionProcedureIds(
      targetSectionId
    );

    const { error: updateStudentsError } = await db
      .from('students')
      .update({ section_id: targetSectionId })
      .in('id', uniqueStudentIds);

    if (updateStudentsError) {
      throw new BadRequestException(updateStudentsError.message);
    }

    const { error: deleteProceduresError } = await db
      .from('student_procedures')
      .delete()
      .in('student_id', uniqueStudentIds);

    if (deleteProceduresError) {
      throw new BadRequestException(deleteProceduresError.message);
    }

    if (targetProcedureIds.length > 0) {
      const rows = uniqueStudentIds.flatMap((studentId) =>
        targetProcedureIds.map((procedureId) => ({
          student_id: studentId,
          procedure_id: procedureId,
          status: 'pending',
          notes: null,
        }))
      );

      const { error: insertProceduresError } = await db
        .from('student_procedures')
        .insert(rows);

      if (insertProceduresError) {
        throw new BadRequestException(insertProceduresError.message);
      }
    }

    return { success: true };
  }

  private async replaceStudentProcedures(
    studentId: string,
    procedureIds: string[]
  ) {
    const db = this.supabase.getServiceClient();

    const { error: deleteError } = await db
      .from('student_procedures')
      .delete()
      .eq('student_id', studentId);

    if (deleteError) {
      throw new BadRequestException(deleteError.message);
    }

    if (procedureIds.length === 0) {
      return;
    }

    const { error: insertError } = await db.from('student_procedures').insert(
      procedureIds.map((procedureId) => ({
        student_id: studentId,
        procedure_id: procedureId,
        status: 'pending',
        notes: null,
      }))
    );

    if (insertError) {
      throw new BadRequestException(insertError.message);
    }
  }

  private async getTargetSectionProcedureIds(
    targetSectionId: string,
    excludeStudentId?: string
  ): Promise<string[]> {
    const db = this.supabase.getServiceClient();

    const { data: sectionStudents, error: sectionStudentsError } = await db
      .from('students')
      .select('id')
      .eq('section_id', targetSectionId);

    if (sectionStudentsError) {
      throw new BadRequestException(sectionStudentsError.message);
    }

    const targetStudentIds = (sectionStudents ?? [])
      .map((student) => student.id)
      .filter((id) => id !== excludeStudentId);

    if (targetStudentIds.length === 0) {
      return [];
    }

    const { data: procedureRows, error: procedureRowsError } = await db
      .from('student_procedures')
      .select('procedure_id')
      .in('student_id', targetStudentIds);

    if (procedureRowsError) {
      throw new BadRequestException(procedureRowsError.message);
    }

    return [...new Set((procedureRows ?? []).map((row) => row.procedure_id))];
  }

  private async requireAdmin(accessToken: string) {
    const caller = await this.supabase.verifyAndGetProfile(accessToken);

    if (
      !caller ||
      caller.profile.role !== 'admin' ||
      caller.profile.status !== 'approved'
    ) {
      throw new UnauthorizedException('Approved admin access required');
    }

    return caller;
  }
}
