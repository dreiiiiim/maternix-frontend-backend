-- ================================================================
-- FIX: Replace recursive RLS policies with SECURITY DEFINER helpers
-- Root cause: policies that do SELECT FROM profiles INSIDE a policy
-- ON profiles cause infinite recursion → PostgREST 500.
-- Run this in Supabase Dashboard → SQL Editor.
-- ================================================================

-- ================================================================
-- STEP 1 — Create SECURITY DEFINER helpers
-- These run as the function owner (postgres), bypassing RLS entirely,
-- so they never trigger the recursive policy evaluation.
-- ================================================================

CREATE OR REPLACE FUNCTION public.is_approved_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND status = 'approved'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_approved_instructor()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'instructor'
      AND status = 'approved'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_approved_user()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND status = 'approved'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_instructor_or_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('instructor', 'admin')
      AND status = 'approved'
  )
$$;

-- ================================================================
-- STEP 2 — Drop ALL existing policies (clean slate)
-- ================================================================

-- profiles
DROP POLICY IF EXISTS "own_read"       ON public.profiles;
DROP POLICY IF EXISTS "admin_read_all" ON public.profiles;
DROP POLICY IF EXISTS "admin_update"   ON public.profiles;

-- sections
DROP POLICY IF EXISTS "sections_read"  ON public.sections;
DROP POLICY IF EXISTS "sections_admin" ON public.sections;

-- students
DROP POLICY IF EXISTS "students_own"        ON public.students;
DROP POLICY IF EXISTS "students_instructor" ON public.students;
DROP POLICY IF EXISTS "students_admin"      ON public.students;

-- instructors
DROP POLICY IF EXISTS "instructors_own"   ON public.instructors;
DROP POLICY IF EXISTS "instructors_admin" ON public.instructors;

-- procedures
DROP POLICY IF EXISTS "procedures_read"   ON public.procedures;
DROP POLICY IF EXISTS "procedures_manage" ON public.procedures;

-- student_procedures
DROP POLICY IF EXISTS "sp_own"        ON public.student_procedures;
DROP POLICY IF EXISTS "sp_own_update" ON public.student_procedures;
DROP POLICY IF EXISTS "sp_instructor" ON public.student_procedures;
DROP POLICY IF EXISTS "sp_admin"      ON public.student_procedures;

-- evaluations
DROP POLICY IF EXISTS "eval_student"    ON public.evaluations;
DROP POLICY IF EXISTS "eval_instructor" ON public.evaluations;
DROP POLICY IF EXISTS "eval_insert"     ON public.evaluations;
DROP POLICY IF EXISTS "eval_update"     ON public.evaluations;
DROP POLICY IF EXISTS "eval_admin"      ON public.evaluations;

-- announcements
DROP POLICY IF EXISTS "ann_read"   ON public.announcements;
DROP POLICY IF EXISTS "ann_insert" ON public.announcements;
DROP POLICY IF EXISTS "ann_update" ON public.announcements;
DROP POLICY IF EXISTS "ann_delete" ON public.announcements;

-- email_logs
DROP POLICY IF EXISTS "logs_admin" ON public.email_logs;

-- ================================================================
-- STEP 3 — Recreate all policies using the helper functions
-- (no more inline EXISTS subqueries on profiles)
-- ================================================================

-- ---- profiles ----
-- Users can always read their own row (no recursion — pure column comparison)
CREATE POLICY "profiles_read_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "profiles_read_admin"
  ON public.profiles FOR SELECT
  USING (public.is_approved_admin());

-- Admins can update any profile (approve / reject)
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (public.is_approved_admin());

-- ---- sections ----
CREATE POLICY "sections_read"
  ON public.sections FOR SELECT
  USING (public.is_approved_user());

CREATE POLICY "sections_admin"
  ON public.sections FOR ALL
  USING (public.is_approved_admin());

-- ---- students ----
CREATE POLICY "students_read_own"
  ON public.students FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "students_read_instructor"
  ON public.students FOR SELECT
  USING (public.is_approved_instructor());

CREATE POLICY "students_all_admin"
  ON public.students FOR ALL
  USING (public.is_approved_admin());

-- ---- instructors ----
CREATE POLICY "instructors_read_own"
  ON public.instructors FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "instructors_all_admin"
  ON public.instructors FOR ALL
  USING (public.is_approved_admin());

-- ---- procedures ----
CREATE POLICY "procedures_read"
  ON public.procedures FOR SELECT
  USING (public.is_approved_user());

CREATE POLICY "procedures_manage"
  ON public.procedures FOR ALL
  USING (public.is_instructor_or_admin());

-- ---- student_procedures ----
CREATE POLICY "sp_read_own"
  ON public.student_procedures FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "sp_update_own"
  ON public.student_procedures FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "sp_read_instructor"
  ON public.student_procedures FOR SELECT
  USING (public.is_approved_instructor());

CREATE POLICY "sp_all_admin"
  ON public.student_procedures FOR ALL
  USING (public.is_approved_admin());

-- ---- evaluations ----
CREATE POLICY "eval_read_student"
  ON public.evaluations FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "eval_read_instructor"
  ON public.evaluations FOR SELECT
  USING (public.is_approved_instructor());

CREATE POLICY "eval_insert_instructor"
  ON public.evaluations FOR INSERT
  WITH CHECK (
    auth.uid() = instructor_id
    AND public.is_approved_instructor()
  );

CREATE POLICY "eval_update_instructor"
  ON public.evaluations FOR UPDATE
  USING (public.is_approved_instructor());

CREATE POLICY "eval_all_admin"
  ON public.evaluations FOR ALL
  USING (public.is_approved_admin());

-- ---- announcements ----
CREATE POLICY "ann_read"
  ON public.announcements FOR SELECT
  USING (
    public.is_approved_user()
    AND (
      target_role = 'all'
      OR target_role = (SELECT role FROM public.profiles WHERE id = auth.uid())
      OR created_by = auth.uid()
    )
  );

CREATE POLICY "ann_insert"
  ON public.announcements FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND public.is_instructor_or_admin()
  );

CREATE POLICY "ann_update"
  ON public.announcements FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "ann_delete"
  ON public.announcements FOR DELETE
  USING (auth.uid() = created_by);

-- ---- email_logs ----
CREATE POLICY "logs_read_admin"
  ON public.email_logs FOR SELECT
  USING (public.is_approved_admin());

-- ================================================================
-- DONE — Test by logging in at /login
-- ================================================================
