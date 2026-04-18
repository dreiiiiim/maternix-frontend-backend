import { Module } from '@nestjs/common';
import { InstructorDashboardController } from './instructor-dashboard.controller';
import { InstructorDashboardService } from './instructor-dashboard.service';

@Module({
  controllers: [InstructorDashboardController],
  providers: [InstructorDashboardService],
})
export class InstructorDashboardModule {}
