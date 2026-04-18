-- ================================================================
-- PROCEDURE RESOURCES
-- Stores uploaded files or links attached to a procedure, such as
-- return demonstration files with rationale.
-- Run after schema.sql and fix-rls.sql.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.procedure_resources (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  procedure_id UUID NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('file','link')),
  name         TEXT NOT NULL,
  url          TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.procedure_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "procedure_resources_read" ON public.procedure_resources;
CREATE POLICY "procedure_resources_read"
  ON public.procedure_resources FOR SELECT
  USING (public.is_approved_user());

DROP POLICY IF EXISTS "procedure_resources_manage" ON public.procedure_resources;
CREATE POLICY "procedure_resources_manage"
  ON public.procedure_resources FOR ALL
  USING (public.is_instructor_or_admin())
  WITH CHECK (public.is_instructor_or_admin());
