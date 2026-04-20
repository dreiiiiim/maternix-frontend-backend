import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/auth.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { StudentDashboardModule } from './student-dashboard/student-dashboard.module';
import { InstructorDashboardModule } from './instructor-dashboard/instructor-dashboard.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    EmailModule,
    AuthModule,
    AnnouncementsModule,
    StudentDashboardModule,
    InstructorDashboardModule,
    AdminModule,
  ],
})
export class AppModule {}
