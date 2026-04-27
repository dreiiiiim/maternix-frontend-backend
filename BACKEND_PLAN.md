# Maternix Track — NestJS Backend Plan

## Overview
Standalone NestJS API server at `backend/` (separate from the Next.js `frontend/`). Handles user registration, admin approval, and transactional email via Nodemailer. Uses Supabase service-role client for privileged DB operations (bypasses RLS).

---

## Stack
- **Framework:** NestJS (latest)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL) via `@supabase/supabase-js`
- **Email:** Nodemailer (SMTP / Gmail App Password)
- **Auth verification:** `@supabase/ssr` server client to validate session JWT from frontend cookie
- **Port:** 3001 (frontend calls `NEXT_PUBLIC_API_URL=http://localhost:3001`)

---

## Project Setup

```bash
nest new backend
cd backend
npm install @supabase/supabase-js nodemailer
npm install --save-dev @types/nodemailer
```

---

## Environment Variables (`backend/.env`)

```env
# Supabase
SUPABASE_URL=https://your-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # NEVER expose to frontend

# Nodemailer
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=maternixtrack@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM="Maternix Track <maternixtrack@gmail.com>"
ADMIN_EMAIL=dapla.lmje@shc.edu.ph

# App
PORT=3001
FRONTEND_URL=http://localhost:3000
```

---

## Supabase SQL Schema

Run in Supabase Dashboard → SQL Editor.

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- profiles (linked to auth.users)
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL CHECK (role IN ('student','instructor','admin')),
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_read"       ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "admin_read_all" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.status = 'approved')
);
CREATE POLICY "admin_update"   ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.status = 'approved')
);

-- sections
CREATE TABLE public.sections (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL UNIQUE,
  semester      TEXT NOT NULL,
  schedule      TEXT,
  instructor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sections_read"  ON public.sections FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.status = 'approved')
);
CREATE POLICY "sections_admin" ON public.sections FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.status = 'approved')
);

-- students
CREATE TABLE public.students (
  id          UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_no  TEXT NOT NULL UNIQUE,
  section_id  UUID REFERENCES public.sections(id) ON DELETE SET NULL,
  year_level  TEXT NOT NULL DEFAULT '2nd Year'
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students_own"        ON public.students FOR SELECT USING (auth.uid() = id);
CREATE POLICY "students_instructor" ON public.students FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.sections s WHERE s.id = students.section_id AND s.instructor_id = auth.uid())
);
CREATE POLICY "students_admin"      ON public.students FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.status = 'approved')
);

-- instructors
CREATE TABLE public.instructors (
  id          UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL UNIQUE,
  department  TEXT NOT NULL
);
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "instructors_own"   ON public.instructors FOR SELECT USING (auth.uid() = id);
CREATE POLICY "instructors_admin" ON public.instructors FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.status = 'approved')
);

-- procedures
CREATE TABLE public.procedures (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'Clinical Procedure',
  description TEXT,
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "procedures_read"   ON public.procedures FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.status = 'approved')
);
CREATE POLICY "procedures_manage" ON public.procedures FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('instructor','admin') AND p.status = 'approved')
);

-- student_procedures
CREATE TABLE public.student_procedures (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  procedure_id UUID NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','evaluated')),
  attempts     INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, procedure_id)
);
ALTER TABLE public.student_procedures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sp_own"        ON public.student_procedures FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "sp_own_update" ON public.student_procedures FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "sp_instructor" ON public.student_procedures FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.students st
    JOIN public.sections sec ON sec.id = st.section_id
    WHERE st.id = student_procedures.student_id AND sec.instructor_id = auth.uid()
  )
);
CREATE POLICY "sp_admin" ON public.student_procedures FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.status = 'approved')
);

-- evaluations
CREATE TABLE public.evaluations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  procedure_id      UUID NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
  instructor_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  overall_score     NUMERIC(5,2),
  max_score         NUMERIC(5,2) DEFAULT 100,
  competency_status TEXT CHECK (competency_status IN ('Competent','Not Yet Competent')),
  feedback          TEXT,
  evaluation_date   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eval_student"    ON public.evaluations FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "eval_instructor" ON public.evaluations FOR SELECT USING (auth.uid() = instructor_id);
CREATE POLICY "eval_insert"     ON public.evaluations FOR INSERT WITH CHECK (
  auth.uid() = instructor_id AND
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'instructor' AND p.status = 'approved')
);
CREATE POLICY "eval_update"     ON public.evaluations FOR UPDATE USING (auth.uid() = instructor_id);
CREATE POLICY "eval_admin"      ON public.evaluations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.status = 'approved')
);

-- announcements
CREATE TABLE public.announcements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'Academic',
  target_role TEXT CHECK (target_role IN ('student','instructor','all')),
  section_id  UUID REFERENCES public.sections(id) ON DELETE SET NULL,
  created_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ann_read"   ON public.announcements FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.status = 'approved'
    AND (target_role = 'all' OR target_role = p.role OR created_by = auth.uid())
  )
);
CREATE POLICY "ann_insert" ON public.announcements FOR INSERT WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('instructor','admin') AND p.status = 'approved')
);
CREATE POLICY "ann_update" ON public.announcements FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "ann_delete" ON public.announcements FOR DELETE USING (auth.uid() = created_by);

-- email_logs
CREATE TABLE public.email_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_email      TEXT NOT NULL,
  subject       TEXT NOT NULL,
  template      TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','failed')),
  error_message TEXT,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs_admin" ON public.email_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.status = 'approved')
);

-- auto-update trigger
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at        BEFORE UPDATE ON public.profiles           FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER procedures_updated_at      BEFORE UPDATE ON public.procedures         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER student_procedures_updated BEFORE UPDATE ON public.student_procedures FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER announcements_updated_at   BEFORE UPDATE ON public.announcements      FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed sections (run after schema)
INSERT INTO public.sections (name, semester) VALUES
  ('BSN 2A', 'Spring 2026'),
  ('BSN 2B', 'Spring 2026'),
  ('BSN 2C', 'Spring 2026');

-- Seed admin (replace UUID with real auth.users ID after creating admin in Supabase Dashboard)
-- INSERT INTO public.profiles (id, full_name, email, role, status)
-- VALUES ('<admin-auth-uuid>', 'System Admin', 'dapla.lmje@shc.edu.ph', 'admin', 'approved');
```

---

## Module Structure

```
backend/src/
├── app.module.ts
├── main.ts
├── supabase/
│   ├── supabase.module.ts      # Global module exporting SupabaseService
│   └── supabase.service.ts     # Provides service-role client + anon client
├── email/
│   ├── email.module.ts
│   ├── email.service.ts        # Nodemailer transporter + sendEmail()
│   └── email.templates.ts     # HTML template functions
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts      # POST /auth/signup, POST /auth/approve
│   ├── auth.service.ts
│   └── dto/
│       ├── signup.dto.ts
│       └── approve.dto.ts
└── announcements/
    ├── announcements.module.ts
    ├── announcements.controller.ts  # POST /announcements/email
    └── announcements.service.ts
```

---

## CORS Setup (`main.ts`)

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
```

---

## SupabaseService (`supabase/supabase.service.ts`)

```typescript
import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService {
  private readonly serviceClient: SupabaseClient;

  constructor(private config: ConfigService) {
    this.serviceClient = createClient(
      config.get<string>('SUPABASE_URL')!,
      config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  getServiceClient(): SupabaseClient {
    return this.serviceClient;
  }

  /** Verify a user JWT and return their profile (role + status). */
  async verifyAndGetProfile(accessToken: string) {
    const anonClient = createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_ANON_KEY')!,
    );
    const { data: { user }, error } = await anonClient.auth.getUser(accessToken);
    if (error || !user) return null;

    const { data: profile } = await this.serviceClient
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single();

    return profile ? { user, profile } : null;
  }
}
```

---

## EmailService (`email/email.service.ts`)

```typescript
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(
    private config: ConfigService,
    private supabase: SupabaseService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: config.get('SMTP_HOST'),
      port: Number(config.get('SMTP_PORT')),
      secure: config.get('SMTP_SECURE') === 'true',
      auth: {
        user: config.get('SMTP_USER'),
        pass: config.get('SMTP_PASS'),
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string, template: string) {
    const db = this.supabase.getServiceClient();
    try {
      await this.transporter.sendMail({
        from: this.config.get('EMAIL_FROM'),
        to,
        subject,
        html,
      });
      await db.from('email_logs').insert({ to_email: to, subject, template, status: 'sent' });
    } catch (err) {
      await db.from('email_logs').insert({
        to_email: to,
        subject,
        template,
        status: 'failed',
        error_message: err instanceof Error ? err.message : String(err),
      });
      throw new InternalServerErrorException('Failed to send email');
    }
  }
}
```

---

## Email Templates (`email/email.templates.ts`)

```typescript
const PINK = '#D37B97';
const GREEN = '#457558';

const base = (content: string) => `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:${PINK};padding:16px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px">Maternix Track</h1>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px">
    ${content}
  </div>
  <p style="color:#999;font-size:12px;text-align:center;margin-top:16px">
    © Maternix Track — Clinical Education Platform
  </p>
</div>`;

export const signupPendingAdminEmail = (d: {
  userName: string; userEmail: string; role: string; requestedDate: string;
}) => base(`
  <h2 style="color:${GREEN}">New Registration Request</h2>
  <p><strong>${d.userName}</strong> (${d.userEmail}) has requested access as a <strong>${d.role}</strong>.</p>
  <p>Requested: ${d.requestedDate}</p>
  <p>Log in to the admin dashboard to approve or reject this request.</p>
`);

export const accountApprovedEmail = (d: { userName: string; appUrl: string }) => base(`
  <h2 style="color:${GREEN}">Account Approved!</h2>
  <p>Hi <strong>${d.userName}</strong>,</p>
  <p>Your Maternix Track account has been approved. You may now log in and begin your clinical journey.</p>
  <a href="${d.appUrl}/login"
     style="display:inline-block;background:${PINK};color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin-top:12px">
    Log In Now
  </a>
`);

export const accountRejectedEmail = (d: { userName: string; reason?: string }) => base(`
  <h2 style="color:#d4183d">Account Not Approved</h2>
  <p>Hi <strong>${d.userName}</strong>,</p>
  <p>Unfortunately your registration request was not approved.${d.reason ? ` Reason: ${d.reason}` : ''}</p>
  <p>Please contact your institution for further assistance.</p>
`);

export const announcementEmail = (d: {
  title: string; content: string; category: string; instructorName: string;
}) => base(`
  <h2 style="color:${GREEN}">${d.title}</h2>
  <span style="background:${PINK}20;color:${PINK};padding:2px 10px;border-radius:999px;font-size:12px">${d.category}</span>
  <p style="margin-top:16px">${d.content}</p>
  <p style="color:#999;font-size:13px;margin-top:24px">Posted by ${d.instructorName}</p>
`);
```

---

## DTOs

### `auth/dto/signup.dto.ts`
```typescript
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @IsString() fullName: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
  @IsEnum(['student', 'instructor']) role: 'student' | 'instructor';

  // Student fields
  @IsOptional() @IsString() studentNo?: string;
  @IsOptional() @IsString() section?: string;

  // Instructor fields
  @IsOptional() @IsString() employeeId?: string;
  @IsOptional() @IsString() department?: string;
}
```

### `auth/dto/approve.dto.ts`
```typescript
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class ApproveDto {
  @IsUUID() userId: string;
  @IsEnum(['approve', 'reject']) action: 'approve' | 'reject';
  @IsOptional() @IsString() reason?: string;
}
```

---

## AuthService (`auth/auth.service.ts`)

```typescript
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { EmailService } from '../email/email.service';
import {
  signupPendingAdminEmail,
  accountApprovedEmail,
  accountRejectedEmail,
} from '../email/email.templates';
import { SignupDto } from './dto/signup.dto';
import { ApproveDto } from './dto/approve.dto';

@Injectable()
export class AuthService {
  constructor(
    private supabase: SupabaseService,
    private email: EmailService,
    private config: ConfigService,
  ) {}

  async signup(dto: SignupDto) {
    const db = this.supabase.getServiceClient();

    // Create auth user (no auto sign-in — stays pending until approved)
    const { data: authData, error: authError } = await db.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true,
    });
    if (authError) throw new BadRequestException(authError.message);

    const userId = authData.user.id;

    // Insert profile
    const { error: profileError } = await db.from('profiles').insert({
      id: userId,
      full_name: dto.fullName,
      email: dto.email,
      role: dto.role,
      status: 'pending',
    });
    if (profileError) throw new BadRequestException(profileError.message);

    // Insert role-specific record
    if (dto.role === 'student') {
      const { data: sectionRow } = await db
        .from('sections')
        .select('id')
        .eq('name', dto.section)
        .single();

      await db.from('students').insert({
        id: userId,
        student_no: dto.studentNo,
        section_id: sectionRow?.id ?? null,
      });
    } else if (dto.role === 'instructor') {
      await db.from('instructors').insert({
        id: userId,
        employee_id: dto.employeeId,
        department: dto.department,
      });
    }

    // Notify admin
    await this.email.sendEmail(
      this.config.get<string>('ADMIN_EMAIL')!,
      `New registration request — ${dto.fullName}`,
      signupPendingAdminEmail({
        userName: dto.fullName,
        userEmail: dto.email,
        role: dto.role,
        requestedDate: new Date().toLocaleString(),
      }),
      'signup_pending',
    );

    return { success: true };
  }

  async approveUser(dto: ApproveDto, accessToken: string) {
    // Verify caller is admin
    const caller = await this.supabase.verifyAndGetProfile(accessToken);
    if (!caller || caller.profile.role !== 'admin' || caller.profile.status !== 'approved') {
      throw new UnauthorizedException('Admin access required');
    }

    const db = this.supabase.getServiceClient();
    const newStatus = dto.action === 'approve' ? 'approved' : 'rejected';

    const { data: profile, error } = await db
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', dto.userId)
      .select('full_name, email')
      .single();

    if (error) throw new BadRequestException(error.message);

    const appUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    if (dto.action === 'approve') {
      await this.email.sendEmail(
        profile.email,
        'Your Maternix Track account is approved',
        accountApprovedEmail({ userName: profile.full_name, appUrl }),
        'approved',
      );
    } else {
      await this.email.sendEmail(
        profile.email,
        'Maternix Track — Account update',
        accountRejectedEmail({ userName: profile.full_name, reason: dto.reason }),
        'rejected',
      );
    }

    return { success: true };
  }
}
```

---

## AuthController (`auth/auth.controller.ts`)

```typescript
import { Body, Controller, Headers, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { ApproveDto } from './dto/approve.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('approve')
  approve(
    @Body() dto: ApproveDto,
    @Headers('authorization') auth: string,
  ) {
    const token = auth?.replace('Bearer ', '') ?? '';
    return this.authService.approveUser(dto, token);
  }
}
```

> **Note for frontend:** The admin dashboard must attach the Supabase session token as `Authorization: Bearer <access_token>` when calling `POST /auth/approve`. Use `supabase.auth.getSession()` on the client to get the token.

---

## AnnouncementsController (`announcements/announcements.controller.ts`)

```typescript
import { Body, Controller, Headers, Post } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';

@Controller('announcements')
export class AnnouncementsController {
  constructor(private service: AnnouncementsService) {}

  @Post('email')
  sendAnnouncementEmail(
    @Body() body: { announcementId: string },
    @Headers('authorization') auth: string,
  ) {
    const token = auth?.replace('Bearer ', '') ?? '';
    return this.service.sendAnnouncementEmail(body.announcementId, token);
  }
}
```

### AnnouncementsService (`announcements/announcements.service.ts`)

```typescript
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { EmailService } from '../email/email.service';
import { announcementEmail } from '../email/email.templates';

@Injectable()
export class AnnouncementsService {
  constructor(private supabase: SupabaseService, private email: EmailService) {}

  async sendAnnouncementEmail(announcementId: string, accessToken: string) {
    const caller = await this.supabase.verifyAndGetProfile(accessToken);
    if (!caller || !['instructor', 'admin'].includes(caller.profile.role)) {
      throw new UnauthorizedException();
    }

    const db = this.supabase.getServiceClient();

    const { data: ann } = await db
      .from('announcements')
      .select('title, content, category, target_role, profiles(full_name)')
      .eq('id', announcementId)
      .single();

    if (!ann) throw new NotFoundException('Announcement not found');

    const { data: recipients } = await db
      .from('profiles')
      .select('email')
      .eq('status', 'approved')
      .in('role', ann.target_role === 'all' ? ['student', 'instructor'] : [ann.target_role]);

    const instructorName =
      (ann.profiles as { full_name: string } | null)?.full_name ?? 'Maternix';

    await Promise.allSettled(
      (recipients ?? []).map((r) =>
        this.email.sendEmail(
          r.email,
          ann.title,
          announcementEmail({
            title: ann.title,
            content: ann.content,
            category: ann.category,
            instructorName,
          }),
          'announcement',
        ),
      ),
    );

    return { success: true };
  }
}
```

---

## AppModule (`app.module.ts`)

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/auth.module';
import { AnnouncementsModule } from './announcements/announcements.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    EmailModule,
    AuthModule,
    AnnouncementsModule,
  ],
})
export class AppModule {}
```

---

## API Reference

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/auth/signup` | None | Register new student or CI |
| POST | `/auth/approve` | `Authorization: Bearer <token>` (admin only) | Approve or reject a pending user |
| POST | `/announcements/email` | `Authorization: Bearer <token>` (instructor/admin) | Send announcement email to recipients |

---

## Frontend Note: Sending Auth Token

When the admin calls `POST /auth/approve`, the frontend must include the Supabase access token:

```typescript
const { data: { session } } = await supabase.auth.getSession();

fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/approve`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  },
  body: JSON.stringify({ userId, action: 'approve' }),
});
```

Update `AdminDashboard.tsx` `handleApprove` / `handleReject` to include this header once the NestJS backend is running.

---

## Verification Checklist

- [ ] `POST /auth/signup` creates auth user + profile (pending) + student/instructor record
- [ ] Admin receives email on signup
- [ ] `POST /auth/approve` (approve) → `profiles.status = 'approved'`, approval email sent
- [ ] `POST /auth/approve` (reject) → `profiles.status = 'rejected'`, rejection email sent
- [ ] Non-admin token rejected with 401
- [ ] `POST /announcements/email` delivers email to all target recipients
- [ ] All emails logged in `email_logs` table
- [ ] CORS allows requests from `http://localhost:3000`
