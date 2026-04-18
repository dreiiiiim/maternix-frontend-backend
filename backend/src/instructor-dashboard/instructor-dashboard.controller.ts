import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { InstructorDashboardService } from './instructor-dashboard.service';

@Controller('instructor/dashboard')
export class InstructorDashboardController {
  constructor(private readonly service: InstructorDashboardService) {}

  @Get()
  getDashboard(@Headers('authorization') auth?: string) {
    const token = auth?.replace('Bearer ', '') ?? '';
    return this.service.getDashboard(token);
  }

  @Get('masterlist')
  getMasterlist(@Headers('authorization') auth?: string) {
    const token = auth?.replace('Bearer ', '') ?? '';
    return this.service.getMasterlist(token);
  }

  @Get('procedures')
  getProcedures(@Headers('authorization') auth?: string) {
    const token = auth?.replace('Bearer ', '') ?? '';
    return this.service.getProcedures(token);
  }

  @Post('procedures')
  addProcedure(
    @Body()
    body: { name?: string; category?: string; description?: string },
    @Headers('authorization') auth?: string
  ) {
    if (!body.name?.trim()) {
      throw new BadRequestException('Procedure name is required');
    }

    const token = auth?.replace('Bearer ', '') ?? '';
    return this.service.addProcedure(
      {
        name: body.name,
        category: body.category,
        description: body.description,
      },
      token
    );
  }

  @Post('procedures/:procedureId/sections/:sectionId/toggle')
  toggleSectionAccess(
    @Param('procedureId') procedureId: string,
    @Param('sectionId') sectionId: string,
    @Headers('authorization') auth?: string
  ) {
    const token = auth?.replace('Bearer ', '') ?? '';
    return this.service.toggleSectionAccess(procedureId, sectionId, token);
  }

  @Patch('student-procedures/note')
  updateStudentProcedureNote(
    @Body()
    body: {
      studentId?: string;
      procedureId?: string;
      notes?: string;
    },
    @Headers('authorization') auth?: string
  ) {
    if (!body.studentId || !body.procedureId) {
      throw new BadRequestException('studentId and procedureId are required');
    }

    const token = auth?.replace('Bearer ', '') ?? '';
    return this.service.updateStudentProcedureNote(
      {
        studentId: body.studentId,
        procedureId: body.procedureId,
        notes: body.notes,
      },
      token
    );
  }

  @Post('evaluations')
  saveEvaluation(
    @Body()
    body: {
      studentId?: string;
      procedureId?: string;
      evaluations?: Record<string, 'performed' | 'not-performed' | null>;
      feedback?: string;
    },
    @Headers('authorization') auth?: string
  ) {
    if (!body.studentId || !body.procedureId) {
      throw new BadRequestException('studentId and procedureId are required');
    }

    const token = auth?.replace('Bearer ', '') ?? '';
    return this.service.saveEvaluation(
      {
        studentId: body.studentId,
        procedureId: body.procedureId,
        evaluations: body.evaluations,
        feedback: body.feedback,
      },
      token
    );
  }
}
