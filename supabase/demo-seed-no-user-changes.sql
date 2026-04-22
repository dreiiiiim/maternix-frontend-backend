-- ================================================================
-- MATERNIX DEMO ANNOUNCEMENTS SEED (NO USER ACCOUNT CHANGES)
-- ================================================================
-- Safe intent:
-- - DOES NOT insert/update/delete records in auth.users
-- - DOES NOT insert/update/delete records in public.profiles
-- - Seeds announcements only
--
-- Also cleans up ONLY the custom demo procedures that were previously
-- added by the old version of this file (IDs 9100...).
-- ================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE role IN ('instructor', 'admin') AND status = 'approved'
  ) THEN
    RAISE NOTICE 'No approved instructor/admin found. Announcement seed skipped.';
  END IF;
END $$;

-- ================================================================
-- STEP 0: Remove old custom procedure demo data (from previous script)
-- This keeps your existing non-demo procedures untouched.
-- ================================================================
WITH demo_procedure_ids AS (
  SELECT id
  FROM (VALUES
    ('91000000-0000-0000-0000-000000000001'::uuid),
    ('91000000-0000-0000-0000-000000000002'::uuid),
    ('91000000-0000-0000-0000-000000000003'::uuid),
    ('91000000-0000-0000-0000-000000000004'::uuid)
  ) AS v(id)
)
DELETE FROM public.evaluations
WHERE procedure_id IN (SELECT id FROM demo_procedure_ids);

WITH demo_procedure_ids AS (
  SELECT id
  FROM (VALUES
    ('91000000-0000-0000-0000-000000000001'::uuid),
    ('91000000-0000-0000-0000-000000000002'::uuid),
    ('91000000-0000-0000-0000-000000000003'::uuid),
    ('91000000-0000-0000-0000-000000000004'::uuid)
  ) AS v(id)
)
DELETE FROM public.student_procedures
WHERE procedure_id IN (SELECT id FROM demo_procedure_ids);

WITH demo_procedure_ids AS (
  SELECT id
  FROM (VALUES
    ('91000000-0000-0000-0000-000000000001'::uuid),
    ('91000000-0000-0000-0000-000000000002'::uuid),
    ('91000000-0000-0000-0000-000000000003'::uuid),
    ('91000000-0000-0000-0000-000000000004'::uuid)
  ) AS v(id)
)
DELETE FROM public.procedure_resources
WHERE procedure_id IN (SELECT id FROM demo_procedure_ids);

DELETE FROM public.procedures
WHERE id IN (
  '91000000-0000-0000-0000-000000000001',
  '91000000-0000-0000-0000-000000000002',
  '91000000-0000-0000-0000-000000000003',
  '91000000-0000-0000-0000-000000000004'
);

-- ================================================================
-- STEP 1: Dummy announcements only
-- ================================================================
WITH author_pool AS (
  SELECT id
  FROM public.profiles
  WHERE role IN ('instructor', 'admin')
    AND status = 'approved'
  ORDER BY
    CASE WHEN role = 'instructor' THEN 0 ELSE 1 END,
    created_at NULLS LAST,
    id
  LIMIT 1
),
seed_announcements AS (
  SELECT *
  FROM (VALUES
    ('93000000-0000-0000-0000-000000000001'::uuid, 'Simulation Week Readiness Checklist', 'Clinical simulation week starts Monday, April 27, 2026. Please complete pre-brief videos, bring your validated skills log, and report 15 minutes before your assigned slot. Teams that arrive complete and on time will be prioritized for first-run scenarios.', 'Schedule', 'all', NULL::text, '2026-04-21 06:30:00+00'::timestamptz),
    ('93000000-0000-0000-0000-000000000002'::uuid, 'Case Presentation Rubric Released', 'The revised rubric for case presentations is now available in Procedure Resources. Focus areas include clinical reasoning, maternal safety prioritization, and concise handoff communication. Review before Wednesday conference.', 'Academic', 'student', NULL::text, '2026-04-20 08:15:00+00'::timestamptz),
    ('93000000-0000-0000-0000-000000000003'::uuid, 'Instructor Calibration Meeting', 'All clinical instructors are requested to join the grading calibration session this Friday at 2:00 PM in the simulation lab conference room. Bring one sample evaluation form for peer alignment review.', 'Event', 'instructor', NULL::text, '2026-04-19 07:00:00+00'::timestamptz),
    ('93000000-0000-0000-0000-000000000004'::uuid, 'Documentation Quality Spotlight', 'Great improvement in SOAP note clarity this week. Continue documenting objective findings before interpretation, and ensure interventions include exact medication dose, route, and response timeline.', 'Policy', 'all', NULL::text, '2026-04-18 05:45:00+00'::timestamptz)
  ) AS t(id, title, content, category, target_role, section_name, created_at)
)
INSERT INTO public.announcements (
  id,
  title,
  content,
  category,
  target_role,
  section_id,
  created_by,
  created_at
)
SELECT
  a.id,
  a.title,
  a.content,
  a.category,
  a.target_role,
  sec.id,
  author.id,
  a.created_at
FROM seed_announcements a
CROSS JOIN author_pool author
LEFT JOIN public.sections sec
  ON sec.name = a.section_name
ON CONFLICT (id) DO UPDATE
SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  category = EXCLUDED.category,
  target_role = EXCLUDED.target_role,
  section_id = EXCLUDED.section_id,
  created_by = EXCLUDED.created_by,
  created_at = EXCLUDED.created_at;

-- ================================================================
-- END
-- ================================================================
