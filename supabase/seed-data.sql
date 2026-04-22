-- ================================================================
-- MATERNIX TRACK — FEATURE SEED DATA
-- Converts all hardcoded mock data from the frontend components
-- into real database rows.
--
-- Run AFTER seed.sql (requires those UUIDs to already exist).
-- Run in: Supabase Dashboard → SQL Editor
-- ================================================================
-- UUID reference from seed.sql:
--   Sections
--     BSN 2A : 10000000-0000-0000-0000-000000000001
--     BSN 2B : 10000000-0000-0000-0000-000000000002
--     BSN 2C : 10000000-0000-0000-0000-000000000003
--   Instructors
--     Dr. Sarah Mitchell   : 30000000-0000-0000-0000-000000000001
--     Prof. Jennifer Lopez : 30000000-0000-0000-0000-000000000002
--   Students BSN 2A
--     Maria Rodriguez  : 40000000-0000-0000-0000-000000000001
--     James Chen       : 40000000-0000-0000-0000-000000000002
--     Sarah Thompson   : 40000000-0000-0000-0000-000000000003
--     David Kim        : 40000000-0000-0000-0000-000000000004
--     Emily Martinez   : 40000000-0000-0000-0000-000000000005
--     Michael Johnson  : 40000000-0000-0000-0000-000000000006
--     Emily Rodriguez  : 40000000-0000-0000-0000-000000000007  ← main test student
--   Students BSN 2B
--     Lisa Anderson    : 40000000-0000-0000-0000-000000000008
--     Robert Taylor    : 40000000-0000-0000-0000-000000000009
--     Jennifer White   : 40000000-0000-0000-0000-000000000010
--     Christopher Lee  : 40000000-0000-0000-0000-000000000011
--     Amanda Garcia    : 40000000-0000-0000-0000-000000000012
--   Students BSN 2C
--     Daniel Brown   : 40000000-0000-0000-0000-000000000013
--     Jessica Davis  : 40000000-0000-0000-0000-000000000014
--     Matthew Wilson : 40000000-0000-0000-0000-000000000015
--     Ashley Miller  : 40000000-0000-0000-0000-000000000016
-- ================================================================
-- New UUIDs (procedures)
--   Leopold's Maneuver    : 50000000-0000-0000-0000-000000000001
--   EINC                  : 50000000-0000-0000-0000-000000000002
--   Labor and Delivery    : 50000000-0000-0000-0000-000000000003
--   Intramuscular Inj.    : 50000000-0000-0000-0000-000000000004
--   Intradermal Inj.      : 50000000-0000-0000-0000-000000000005
--   NICU                  : 50000000-0000-0000-0000-000000000006
--   EINC - Anthropometric Measurements : 50000000-0000-0000-0000-000000000007
--   EINC - Crede's Prophylaxis         : 50000000-0000-0000-0000-000000000008
--   EINC - Infant Bath                 : 50000000-0000-0000-0000-000000000009
-- ================================================================


-- ================================================================
-- STEP 1 — PROCEDURES
-- (from the hardcoded allowedProcedures array in StudentDashboard)
-- ================================================================
INSERT INTO public.procedures (id, name, category, description, created_by)
VALUES
  ('50000000-0000-0000-0000-000000000001',
   'Leopold''s Maneuver',
   'Clinical Procedure',
   'Systematic method of palpating the uterus to determine the position and presentation of the fetus.',
   '30000000-0000-0000-0000-000000000001'),  -- Dr. Sarah Mitchell

  ('50000000-0000-0000-0000-000000000002',
   'EINC',
   'Newborn Care',
   'Early and Immediate Newborn Care protocol including skin-to-skin contact and delayed cord clamping.',
   '30000000-0000-0000-0000-000000000001'),  -- Dr. Sarah Mitchell

  ('50000000-0000-0000-0000-000000000003',
   'Labor and Delivery',
   'Clinical Procedure',
   'Assisting in the stages of labor and delivery under direct supervision of a clinical instructor.',
   '30000000-0000-0000-0000-000000000002'),  -- Prof. Jennifer Lopez

  ('50000000-0000-0000-0000-000000000004',
   'Intramuscular Injection',
   'Medication Administration',
   'Administration of medication directly into a muscle using proper technique and aseptic protocol.',
   '30000000-0000-0000-0000-000000000001'),  -- Dr. Sarah Mitchell

  ('50000000-0000-0000-0000-000000000005',
   'Intradermal Injection',
   'Medication Administration',
   'Injection of a small amount of substance into the dermis layer of the skin for diagnostic or allergy testing.',
   '30000000-0000-0000-0000-000000000001'),  -- Dr. Sarah Mitchell

  ('50000000-0000-0000-0000-000000000006',
   'NICU',
   'Specialized Care',
   'Neonatal Intensive Care Unit procedures for the care of premature or critically ill newborns.',
   '30000000-0000-0000-0000-000000000001'),  -- Dr. Sarah Mitchell

  ('50000000-0000-0000-0000-000000000007',
   'EINC - Anthropometric Measurements',
   'Newborn Care',
   'Anthropometric measurements step within the Early and Immediate Newborn Care workflow.',
   '30000000-0000-0000-0000-000000000001'),

  ('50000000-0000-0000-0000-000000000008',
   'EINC - Crede''s Prophylaxis',
   'Newborn Care',
   'Crede''s prophylaxis step within the Early and Immediate Newborn Care workflow.',
   '30000000-0000-0000-0000-000000000001'),

  ('50000000-0000-0000-0000-000000000009',
   'EINC - Infant Bath',
   'Newborn Care',
   'Infant bath step within the Early and Immediate Newborn Care workflow.',
   '30000000-0000-0000-0000-000000000001')

ON CONFLICT (id) DO NOTHING;


-- ================================================================
-- STEP 2 — STUDENT_PROCEDURES
-- Only the procedures that are "allowed" (not locked) get rows.
-- "Locked" procedures in the mock = no row in student_procedures.
-- ================================================================

-- ── Emily Rodriguez (BSN 2A) — the main test student ────────────
-- Leopold's Maneuver: evaluated (from mock: status='evaluated')
INSERT INTO public.student_procedures (student_id, procedure_id, status, completed_at, notes, created_at)
VALUES (
  '40000000-0000-0000-0000-000000000007',
  '50000000-0000-0000-0000-000000000001',
  'evaluated',
  '2026-04-10 09:00:00+00',
  'Excellent technique demonstrated. Correct identification of fetal position and presentation.',
  '2026-04-05 08:00:00+00'
)
ON CONFLICT (student_id, procedure_id) DO NOTHING;

-- EINC: completed
INSERT INTO public.student_procedures (student_id, procedure_id, status, completed_at, notes, created_at)
VALUES (
  '40000000-0000-0000-0000-000000000007',
  '50000000-0000-0000-0000-000000000002',
  'completed',
  '2026-04-13 10:30:00+00',
  'Successfully implemented Early and Immediate Newborn Care protocol. Good understanding of skin-to-skin contact importance.',
  '2026-04-11 08:00:00+00'
)
ON CONFLICT (student_id, procedure_id) DO NOTHING;

-- Labor and Delivery: pending
INSERT INTO public.student_procedures (student_id, procedure_id, status, notes, created_at)
VALUES (
  '40000000-0000-0000-0000-000000000007',
  '50000000-0000-0000-0000-000000000003',
  'pending',
  'Cleared to assist in labor and delivery. Must be under direct supervision of clinical instructor.',
  '2026-04-14 08:00:00+00'
)
ON CONFLICT (student_id, procedure_id) DO NOTHING;


-- ── Other BSN 2A students — mix of statuses so instructor dashboard has data ──

-- Maria Rodriguez: Leopold's=completed, EINC=pending, Labor=pending
INSERT INTO public.student_procedures (student_id, procedure_id, status, completed_at, created_at)
VALUES ('40000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','completed','2026-04-09 10:00:00+00','2026-04-05 08:00:00+00')
ON CONFLICT (student_id, procedure_id) DO NOTHING;
INSERT INTO public.student_procedures (student_id, procedure_id, status, created_at)
VALUES ('40000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000002','pending','2026-04-11 08:00:00+00')
ON CONFLICT (student_id, procedure_id) DO NOTHING;
INSERT INTO public.student_procedures (student_id, procedure_id, status, created_at)
VALUES ('40000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000003','pending','2026-04-14 08:00:00+00')
ON CONFLICT (student_id, procedure_id) DO NOTHING;

-- James Chen: Leopold's=evaluated, EINC=completed, Labor=pending
INSERT INTO public.student_procedures (student_id, procedure_id, status, completed_at, created_at)
VALUES ('40000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000001','evaluated','2026-04-08 11:00:00+00','2026-04-05 08:00:00+00')
ON CONFLICT (student_id, procedure_id) DO NOTHING;
INSERT INTO public.student_procedures (student_id, procedure_id, status, completed_at, created_at)
VALUES ('40000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000002','completed','2026-04-12 09:00:00+00','2026-04-11 08:00:00+00')
ON CONFLICT (student_id, procedure_id) DO NOTHING;
INSERT INTO public.student_procedures (student_id, procedure_id, status, created_at)
VALUES ('40000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000003','pending','2026-04-14 08:00:00+00')
ON CONFLICT (student_id, procedure_id) DO NOTHING;

-- Sarah Thompson: Leopold's=pending, EINC=pending
INSERT INTO public.student_procedures (student_id, procedure_id, status, created_at)
VALUES ('40000000-0000-0000-0000-000000000003','50000000-0000-0000-0000-000000000001','pending','2026-04-05 08:00:00+00')
ON CONFLICT (student_id, procedure_id) DO NOTHING;
INSERT INTO public.student_procedures (student_id, procedure_id, status, created_at)
VALUES ('40000000-0000-0000-0000-000000000003','50000000-0000-0000-0000-000000000002','pending','2026-04-11 08:00:00+00')
ON CONFLICT (student_id, procedure_id) DO NOTHING;

-- David Kim: Leopold's=in_progress
INSERT INTO public.student_procedures (student_id, procedure_id, status, created_at)
VALUES ('40000000-0000-0000-0000-000000000004','50000000-0000-0000-0000-000000000001','in_progress','2026-04-05 08:00:00+00')
ON CONFLICT (student_id, procedure_id) DO NOTHING;

-- Emily Martinez: Leopold's=completed, EINC=pending
INSERT INTO public.student_procedures (student_id, procedure_id, status, completed_at, created_at)
VALUES ('40000000-0000-0000-0000-000000000005','50000000-0000-0000-0000-000000000001','completed','2026-04-11 14:00:00+00','2026-04-05 08:00:00+00')
ON CONFLICT (student_id, procedure_id) DO NOTHING;
INSERT INTO public.student_procedures (student_id, procedure_id, status, created_at)
VALUES ('40000000-0000-0000-0000-000000000005','50000000-0000-0000-0000-000000000002','pending','2026-04-11 08:00:00+00')
ON CONFLICT (student_id, procedure_id) DO NOTHING;

-- Michael Johnson: Leopold's=pending
INSERT INTO public.student_procedures (student_id, procedure_id, status, created_at)
VALUES ('40000000-0000-0000-0000-000000000006','50000000-0000-0000-0000-000000000001','pending','2026-04-05 08:00:00+00')
ON CONFLICT (student_id, procedure_id) DO NOTHING;


-- ── BSN 2B students — Labor and Delivery assigned by Prof. Jennifer Lopez ──

INSERT INTO public.student_procedures (student_id, procedure_id, status, created_at)
VALUES ('40000000-0000-0000-0000-000000000008','50000000-0000-0000-0000-000000000003','pending','2026-04-14 08:00:00+00')
ON CONFLICT (student_id, procedure_id) DO NOTHING;
INSERT INTO public.student_procedures (student_id, procedure_id, status, created_at)
VALUES ('40000000-0000-0000-0000-000000000009','50000000-0000-0000-0000-000000000003','pending','2026-04-14 08:00:00+00')
ON CONFLICT (student_id, procedure_id) DO NOTHING;
INSERT INTO public.student_procedures (student_id, procedure_id, status, completed_at, created_at)
VALUES ('40000000-0000-0000-0000-000000000010','50000000-0000-0000-0000-000000000003','completed','2026-04-15 11:00:00+00','2026-04-14 08:00:00+00')
ON CONFLICT (student_id, procedure_id) DO NOTHING;
INSERT INTO public.student_procedures (student_id, procedure_id, status, created_at)
VALUES ('40000000-0000-0000-0000-000000000011','50000000-0000-0000-0000-000000000003','in_progress','2026-04-14 08:00:00+00')
ON CONFLICT (student_id, procedure_id) DO NOTHING;
INSERT INTO public.student_procedures (student_id, procedure_id, status, created_at)
VALUES ('40000000-0000-0000-0000-000000000012','50000000-0000-0000-0000-000000000003','pending','2026-04-14 08:00:00+00')
ON CONFLICT (student_id, procedure_id) DO NOTHING;


-- ================================================================
-- STEP 3 — EVALUATIONS
-- (from the hardcoded evaluation object in StudentDashboard mock)
-- ================================================================

-- Emily Rodriguez — Leopold's Maneuver evaluation by Dr. Sarah Mitchell
INSERT INTO public.evaluations (
  id, student_id, procedure_id, instructor_id,
  overall_score, max_score, competency_status, feedback, evaluation_date
)
VALUES (
  '60000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000007',   -- Emily Rodriguez
  '50000000-0000-0000-0000-000000000001',   -- Leopold's Maneuver
  '30000000-0000-0000-0000-000000000001',   -- Dr. Sarah Mitchell
  95.00,
  100.00,
  'Competent',
  'Outstanding performance. Your technique was precise and you demonstrated excellent understanding of fetal positioning. Continue to maintain this level of proficiency in future clinical procedures.',
  '2026-04-11 09:00:00+00'
)
ON CONFLICT (id) DO NOTHING;

-- James Chen — Leopold's Maneuver evaluation by Dr. Sarah Mitchell
INSERT INTO public.evaluations (
  id, student_id, procedure_id, instructor_id,
  overall_score, max_score, competency_status, feedback, evaluation_date
)
VALUES (
  '60000000-0000-0000-0000-000000000002',
  '40000000-0000-0000-0000-000000000002',   -- James Chen
  '50000000-0000-0000-0000-000000000001',   -- Leopold's Maneuver
  '30000000-0000-0000-0000-000000000001',   -- Dr. Sarah Mitchell
  88.00,
  100.00,
  'Competent',
  'Good performance overall. Review the fundal palpation step for more consistent results.',
  '2026-04-09 10:00:00+00'
)
ON CONFLICT (id) DO NOTHING;


-- ================================================================
-- STEP 4 — ANNOUNCEMENTS
-- (from hardcoded announcements in StudentDashboard and
--  the three announcements shown in AnnouncementsPage)
-- ================================================================

INSERT INTO public.announcements (id, title, content, category, target_role, created_by, created_at)
VALUES
  ('70000000-0000-0000-0000-000000000001',
   'New Clinical Modules Available',
   'Exciting news! We have just released new clinical modules focusing on postpartum care and neonatal assessment. Please review the updated materials in your learning portal before your next clinical rotation.',
   'Academic',
   'all',
   '30000000-0000-0000-0000-000000000001',   -- Dr. Sarah Mitchell
   '2026-04-12 08:00:00+00'),

  ('70000000-0000-0000-0000-000000000002',
   'Clinical Rotation Schedule Update',
   'Please note that the clinical rotation schedule for Week 6 has been updated. All students assigned to Labor & Delivery should report to the 3rd floor nurse station at 6:45 AM instead of 7:00 AM. Ensure your clinical uniforms are complete.',
   'Schedule',
   'all',
   '30000000-0000-0000-0000-000000000002',   -- Prof. Jennifer Lopez
   '2026-04-10 07:30:00+00'),

  ('70000000-0000-0000-0000-000000000003',
   'Competency Assessment Reminder',
   'Reminder: All students must complete their mid-term competency assessments by April 20th. Please coordinate with your assigned clinical instructor to schedule your evaluation session. Failure to complete by the deadline will result in an incomplete for the semester.',
   'Assessment',
   'student',
   '30000000-0000-0000-0000-000000000001',   -- Dr. Sarah Mitchell
   '2026-04-08 09:00:00+00')

ON CONFLICT (id) DO NOTHING;


-- ================================================================
-- DONE — Summary of what was seeded
-- ================================================================
-- Procedures (9):
--   Leopold's Maneuver, EINC, Labor and Delivery,
--   Intramuscular Injection, Intradermal Injection, NICU,
--   EINC - Anthropometric Measurements,
--   EINC - Crede's Prophylaxis,
--   EINC - Infant Bath
--
-- Student Procedures:
--   BSN 2A — Leopold's + EINC + Labor assigned to all 7 students
--             (Emily Rodriguez: evaluated/completed/pending)
--   BSN 2B — Labor and Delivery assigned to all 5 students
--
-- Evaluations (2):
--   Emily Rodriguez — Leopold's: 95/100 Competent
--   James Chen      — Leopold's: 88/100 Competent
--
-- Announcements (3):
--   "New Clinical Modules Available"       — Academic — target: all
--   "Clinical Rotation Schedule Update"    — Schedule — target: all
--   "Competency Assessment Reminder"       — Assessment — target: student
-- ================================================================
