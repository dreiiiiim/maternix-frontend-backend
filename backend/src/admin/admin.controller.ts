import { BadRequestException, Body, Controller, Headers, Post } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Post('students/move')
  moveStudent(
    @Body() body: { studentId?: string; targetSectionId?: string },
    @Headers('authorization') auth?: string
  ) {
    if (!body.studentId || !body.targetSectionId) {
      throw new BadRequestException('studentId and targetSectionId are required');
    }

    const token = auth?.replace('Bearer ', '') ?? '';
    return this.service.moveStudent(body.studentId, body.targetSectionId, token);
  }

  @Post('students/bulk-assign')
  bulkAssignStudents(
    @Body() body: { studentIds?: string[]; targetSectionId?: string },
    @Headers('authorization') auth?: string
  ) {
    if (!body.targetSectionId || !body.studentIds?.length) {
      throw new BadRequestException('studentIds and targetSectionId are required');
    }

    const token = auth?.replace('Bearer ', '') ?? '';
    return this.service.bulkAssignStudents(body.studentIds, body.targetSectionId, token);
  }
}
