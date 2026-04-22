import { Body, Controller, Get, Headers, Patch } from '@nestjs/common';
import { StudentDashboardService } from './student-dashboard.service';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';

@Controller('student/dashboard')
export class StudentDashboardController {
  constructor(private readonly service: StudentDashboardService) {}

  @Get()
  getDashboard(@Headers('authorization') auth?: string) {
    const token = auth?.replace('Bearer ', '') ?? '';
    return this.service.getDashboard(token);
  }

  @Get('profile')
  getProfile(@Headers('authorization') auth?: string) {
    const token = auth?.replace('Bearer ', '') ?? '';
    return this.service.getProfile(token);
  }

  @Patch('profile')
  updateProfile(
    @Headers('authorization') auth: string | undefined,
    @Body() body: UpdateStudentProfileDto
  ) {
    const token = auth?.replace('Bearer ', '') ?? '';
    return this.service.updateProfile(token, body);
  }
}
