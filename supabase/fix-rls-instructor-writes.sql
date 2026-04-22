-- ================================================================
-- FIX: Missing RLS policies for instructor write operations
-- and user self-update.
--
-- Run AFTER fix-rls.sql.
-- Run in: Supabase Dashboard → SQL Editor
-- ================================================================

-- ----------------------------------------------------------------
-- profiles: allow users to UPDATE their own row
-- (students need this to save name/phone/avatar from StudentProfile)
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ----------------------------------------------------------------
-- student_procedures: instructor can INSERT
-- (used when toggling section access ON in ProcedureManagement)
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "sp_insert_instructor" ON public.student_procedures;
CREATE POLICY "sp_insert_instructor"
  ON public.student_procedures FOR INSERT
  WITH CHECK (public.is_approved_instructor());

-- ----------------------------------------------------------------
-- student_procedures: instructor can UPDATE
-- (used when saving notes or updating status to 'evaluated')
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "sp_update_instructor" ON public.student_procedures;
CREATE POLICY "sp_update_instructor"
  ON public.student_procedures FOR UPDATE
  USING (public.is_approved_instructor());

-- ----------------------------------------------------------------
-- student_procedures: instructor can DELETE
-- (used when toggling section access OFF in ProcedureManagement)
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "sp_delete_instructor" ON public.student_procedures;
CREATE POLICY "sp_delete_instructor"
  ON public.student_procedures FOR DELETE
  USING (public.is_approved_instructor());

-- ----------------------------------------------------------------
-- sections: instructors can SELECT their own sections
-- (already covered by sections_read via is_approved_user —
--  but admins also need INSERT/UPDATE/DELETE, which sections_admin
--  already provides via FOR ALL. No changes needed here.)
-- ----------------------------------------------------------------

-- ----------------------------------------------------------------
-- instructors: allow approved instructors to read all instructors
-- (needed so InstructorDashboard can read its own record)
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "instructors_read_approved" ON public.instructors;
CREATE POLICY "instructors_read_approved"
  ON public.instructors FOR SELECT
  USING (public.is_approved_user());

-- ================================================================
-- DONE
-- ================================================================
