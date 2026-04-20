-- Ensure one latest evaluation per student and procedure.
-- Keep the newest row by evaluation_date (fallback created_at), delete older duplicates.
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

-- Enforce one row per (student_id, procedure_id) for deterministic latest-evaluation behavior.
CREATE UNIQUE INDEX IF NOT EXISTS evaluations_student_procedure_uidx
  ON public.evaluations (student_id, procedure_id);