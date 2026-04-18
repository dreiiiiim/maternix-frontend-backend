import { Controller, Get, Headers } from '@nestjs/common';
import { StudentDashboardService } from './student-dashboard.service';

@Controller('student/dashboard')
export class StudentDashboardController {
  constructor(private readonly service: StudentDashboardService) {}

  @Get()
  getDashboard(@Headers('authorization') auth?: string) {
    const token = auth?.replace('Bearer ', '') ?? '';
    return this.service.getDashboard(token);
  }
}
