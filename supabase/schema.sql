CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- profiles
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
CREATE POLICY "admin_read_all" ON public.profiles FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.status = 'approved'));
CREATE POLICY "admin_update"   ON public.profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.status = 'approved'));

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
CREATE POLICY "sections_read"  ON public.sections FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.status = 'approved'));
CREATE POLICY "sections_admin" ON public.sections FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.status = 'approved'));

-- students
CREATE TABLE public.students (
  id          UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_no  TEXT NOT NULL UNIQUE,
  section_id  UUID REFERENCES public.sections(id) ON DELETE SET NULL,
  year_level  TEXT NOT NULL DEFAULT '2nd Year'
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students_own"        ON public.students FOR SELECT USING (auth.uid() = id);
CREATE POLICY "students_instructor" ON public.students FOR SELECT USING (EXISTS (SELECT 1 FROM public.sections s WHERE s.id = students.section_id AND s.instructor_id = auth.uid()));
CREATE POLICY "students_admin"      ON public.students FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.status = 'approved'));

-- instructors
CREATE TABLE public.instructors (
  id          UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL UNIQUE,
  department  TEXT NOT NULL
);
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "instructors_own"   ON public.instructors FOR SELECT USING (auth.uid() = id);
CREATE POLICY "instructors_admin" ON public.instructors FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.status = 'approved'));

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
CREATE POLICY "procedures_read"   ON public.procedures FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.status = 'approved'));
CREATE POLICY "procedures_manage" ON public.procedures FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('instructor','admin') AND p.status = 'approved'));

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
CREATE POLICY "sp_instructor" ON public.student_procedures FOR SELECT USING (EXISTS (
  SELECT 1
  FROM public.students st
  JOIN public.sections sec ON sec.id = st.section_id
  WHERE st.id = student_procedures.student_id
    AND sec.instructor_id = auth.uid()
));
CREATE POLICY "sp_admin"      ON public.student_procedures FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.status = 'approved'));

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
  auth.uid() = instructor_id
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'instructor' AND p.status = 'approved')
);
CREATE POLICY "eval_update"     ON public.evaluations FOR UPDATE USING (auth.uid() = instructor_id);
CREATE POLICY "eval_admin"      ON public.evaluations FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.status = 'approved'));

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
CREATE POLICY "ann_read"   ON public.announcements FOR SELECT USING (EXISTS (
  SELECT 1
  FROM public.profiles p
  WHERE p.id = auth.uid()
    AND p.status = 'approved'
    AND (target_role = 'all' OR target_role = p.role OR created_by = auth.uid())
));
CREATE POLICY "ann_insert" ON public.announcements FOR INSERT WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('instructor','admin') AND p.status = 'approved')
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
CREATE POLICY "logs_admin" ON public.email_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.status = 'approved'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at        BEFORE UPDATE ON public.profiles           FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER procedures_updated_at      BEFORE UPDATE ON public.procedures         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER student_procedures_updated BEFORE UPDATE ON public.student_procedures FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER announcements_updated_at   BEFORE UPDATE ON public.announcements      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
