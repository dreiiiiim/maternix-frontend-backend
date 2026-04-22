-- ================================================================
-- GLOBAL CI ACCESS MIGRATION
-- ================================================================
-- Goal:
-- - All approved instructors can see all students/sections
-- - All approved instructors can read/write student_procedures globally
-- - All approved instructors can read/update evaluations globally
-- - Keep one latest evaluation row per (student_id, procedure_id)
-- ================================================================

-- Ensure helper exists (safe with/without fix-rls.sql already applied)
CREATE OR REPLACE FUNCTION public.is_approved_instructor()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'instructor'
      AND status = 'approved'
  )
$$;

-- ------------------------------------------------
-- 1) Deduplicate evaluations, keep latest record
-- ------------------------------------------------
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY student_id, procedure_id
      ORDER BY evaluation_date DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
    ) AS row_num
  FROM public.evaluations
)
DELETE FROM public.evaluations e
USING ranked r
WHERE e.id = r.id
  AND r.row_num > 1;

-- Enforce one row per student/procedure so all CI share one evaluation state.
CREATE UNIQUE INDEX IF NOT EXISTS evaluations_student_procedure_uidx
  ON public.evaluations (student_id, procedure_id);

-- ------------------------------------------------
-- 2) Students: global instructor read
-- ------------------------------------------------
DROP POLICY IF EXISTS "students_instructor" ON public.students;
DROP POLICY IF EXISTS "students_read_instructor" ON public.students;
CREATE POLICY "students_read_instructor"
  ON public.students FOR SELECT
  USING (public.is_approved_instructor());

-- ------------------------------------------------
-- 3) Student procedures: global instructor access
-- ------------------------------------------------
DROP POLICY IF EXISTS "sp_instructor" ON public.student_procedures;
DROP POLICY IF EXISTS "sp_read_instructor" ON public.student_procedures;
CREATE POLICY "sp_read_instructor"
  ON public.student_procedures FOR SELECT
  USING (public.is_approved_instructor());

DROP POLICY IF EXISTS "sp_insert_instructor" ON public.student_procedures;
CREATE POLICY "sp_insert_instructor"
  ON public.student_procedures FOR INSERT
  WITH CHECK (public.is_approved_instructor());

DROP POLICY IF EXISTS "sp_update_instructor" ON public.student_procedures;
CREATE POLICY "sp_update_instructor"
  ON public.student_procedures FOR UPDATE
  USING (public.is_approved_instructor());

DROP POLICY IF EXISTS "sp_delete_instructor" ON public.student_procedures;
CREATE POLICY "sp_delete_instructor"
  ON public.student_procedures FOR DELETE
  USING (public.is_approved_instructor());

-- ------------------------------------------------
-- 4) Evaluations: global instructor read/update
-- ------------------------------------------------
DROP POLICY IF EXISTS "eval_instructor" ON public.evaluations;
DROP POLICY IF EXISTS "eval_read_instructor" ON public.evaluations;
CREATE POLICY "eval_read_instructor"
  ON public.evaluations FOR SELECT
  USING (public.is_approved_instructor());

DROP POLICY IF EXISTS "eval_update" ON public.evaluations;
DROP POLICY IF EXISTS "eval_update_instructor" ON public.evaluations;
CREATE POLICY "eval_update_instructor"
  ON public.evaluations FOR UPDATE
  USING (public.is_approved_instructor());
