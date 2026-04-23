-- ================================================================
-- MATERNIX TRACK — TEST SEED DATA
-- Run in: Supabase Dashboard → SQL Editor
-- All accounts use password: password123
-- All accounts are pre-approved (status = 'approved')
-- ================================================================
-- Run the schema.sql FIRST before this file.
-- ================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ================================================================
-- UUIDs reference (fixed so seed is reproducible)
-- ================================================================
-- Sections
--   BSN 2A  : 10000000-0000-0000-0000-000000000001
--   BSN 2B  : 10000000-0000-0000-0000-000000000002
--   BSN 2C  : 10000000-0000-0000-0000-000000000003
-- Admin
--   System Admin  : 20000000-0000-0000-0000-000000000001
-- Instructors
--   Dr. Sarah Mitchell    : 30000000-0000-0000-0000-000000000001
--   Prof. Jennifer Lopez  : 30000000-0000-0000-0000-000000000002
-- Students (BSN 2A)
--   Maria Rodriguez  : 40000000-0000-0000-0000-000000000001
--   James Chen       : 40000000-0000-0000-0000-000000000002
--   Sarah Thompson   : 40000000-0000-0000-0000-000000000003
--   David Kim        : 40000000-0000-0000-0000-000000000004
--   Emily Martinez   : 40000000-0000-0000-0000-000000000005
--   Michael Johnson  : 40000000-0000-0000-0000-000000000006
--   Emily Rodriguez  : 40000000-0000-0000-0000-000000000007  ← the "logged-in" student
-- Students (BSN 2B)
--   Lisa Anderson    : 40000000-0000-0000-0000-000000000008
--   Robert Taylor    : 40000000-0000-0000-0000-000000000009
--   Jennifer White   : 40000000-0000-0000-0000-000000000010
--   Christopher Lee  : 40000000-0000-0000-0000-000000000011
--   Amanda Garcia    : 40000000-0000-0000-0000-000000000012
-- Students (BSN 2C)
--   Daniel Brown    : 40000000-0000-0000-0000-000000000013
--   Jessica Davis   : 40000000-0000-0000-0000-000000000014
--   Matthew Wilson  : 40000000-0000-0000-0000-000000000015
--   Ashley Miller   : 40000000-0000-0000-0000-000000000016

-- ================================================================
-- STEP 1 — SECTIONS
-- ================================================================
INSERT INTO public.sections (id, name, semester, schedule)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'BSN 2A', 'Spring 2026', 'Mon/Wed 8:00 AM – 12:00 PM'),
  ('10000000-0000-0000-0000-000000000002', 'BSN 2B', 'Spring 2026', 'Tue/Thu 1:00 PM – 5:00 PM'),
  ('10000000-0000-0000-0000-000000000003', 'BSN 2C', 'Spring 2026', 'Fri 8:00 AM – 4:00 PM')
ON CONFLICT (name) DO NOTHING;

-- ================================================================
-- STEP 2 — AUTH USERS  (creates loginable Supabase accounts)
-- ================================================================
INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_super_admin,
  confirmation_token, recovery_token,
  email_change_token_new, email_change
)
VALUES
  -- Admin
  ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'admin@maternixtrack.edu',   crypt('password123',gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}','{}', now(),now(),false,'','','',''),

  -- Instructors
  ('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'sarah.mitchell@nursing.edu', crypt('password123',gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}','{}', now(),now(),false,'','','',''),
  ('30000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'jennifer.lopez@nursing.edu', crypt('password123',gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}','{}', now(),now(),false,'','','',''),

  -- Students — BSN 2A
  ('40000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'maria.rodriguez@nursing.edu', crypt('password123',gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}','{}', now(),now(),false,'','','',''),
  ('40000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'james.chen@nursing.edu', crypt('password123',gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}','{}', now(),now(),false,'','','',''),
  ('40000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'sarah.thompson@nursing.edu', crypt('password123',gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}','{}', now(),now(),false,'','','',''),
  ('40000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'david.kim@nursing.edu', crypt('password123',gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}','{}', now(),now(),false,'','','',''),
  ('40000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'emily.martinez@nursing.edu', crypt('password123',gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}','{}', now(),now(),false,'','','',''),
  ('40000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'michael.johnson@nursing.edu', crypt('password123',gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}','{}', now(),now(),false,'','','',''),
  ('40000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'emily.rodriguez@nursing.edu', crypt('password123',gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}','{}', now(),now(),false,'','','',''),

  -- Students — BSN 2B
  ('40000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'lisa.anderson@nursing.edu', crypt('password123',gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}','{}', now(),now(),false,'','','',''),
  ('40000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'robert.taylor@nursing.edu', crypt('password123',gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}','{}', now(),now(),false,'','','',''),
  ('40000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'jennifer.white@nursing.edu', crypt('password123',gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}','{}', now(),now(),false,'','','',''),
  ('40000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'christopher.lee@nursing.edu', crypt('password123',gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}','{}', now(),now(),false,'','','',''),
  ('40000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'amanda.garcia@nursing.edu', crypt('password123',gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}','{}', now(),now(),false,'','','',''),

  -- Students — BSN 2C
  ('40000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'daniel.brown@nursing.edu', crypt('password123',gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}','{}', now(),now(),false,'','','',''),
  ('40000000-0000-0000-0000-000000000014','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'jessica.davis@nursing.edu', crypt('password123',gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}','{}', now(),now(),false,'','','',''),
  ('40000000-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'matthew.wilson@nursing.edu', crypt('password123',gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}','{}', now(),now(),false,'','','',''),
  ('40000000-0000-0000-0000-000000000016','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'ashley.miller@nursing.edu', crypt('password123',gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}','{}', now(),now(),false,'','','','')

ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- STEP 3 — AUTH IDENTITIES  (required for email login to work)
-- ================================================================
INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
  -- Admin
  ('20000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   '{"sub":"20000000-0000-0000-0000-000000000001","email":"admin@maternixtrack.edu"}',
   'email', now(), now(), now()),

  -- Instructors
  ('30000000-0000-0000-0000-000000000001',
   '30000000-0000-0000-0000-000000000001',
   '{"sub":"30000000-0000-0000-0000-000000000001","email":"sarah.mitchell@nursing.edu"}',
   'email', now(), now(), now()),
  ('30000000-0000-0000-0000-000000000002',
   '30000000-0000-0000-0000-000000000002',
   '{"sub":"30000000-0000-0000-0000-000000000002","email":"jennifer.lopez@nursing.edu"}',
   'email', now(), now(), now()),

  -- Students — BSN 2A
  ('40000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001',
   '{"sub":"40000000-0000-0000-0000-000000000001","email":"maria.rodriguez@nursing.edu"}','email',now(),now(),now()),
  ('40000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000002',
   '{"sub":"40000000-0000-0000-0000-000000000002","email":"james.chen@nursing.edu"}','email',now(),now(),now()),
  ('40000000-0000-0000-0000-000000000003','40000000-0000-0000-0000-000000000003',
   '{"sub":"40000000-0000-0000-0000-000000000003","email":"sarah.thompson@nursing.edu"}','email',now(),now(),now()),
  ('40000000-0000-0000-0000-000000000004','40000000-0000-0000-0000-000000000004',
   '{"sub":"40000000-0000-0000-0000-000000000004","email":"david.kim@nursing.edu"}','email',now(),now(),now()),
  ('40000000-0000-0000-0000-000000000005','40000000-0000-0000-0000-000000000005',
   '{"sub":"40000000-0000-0000-0000-000000000005","email":"emily.martinez@nursing.edu"}','email',now(),now(),now()),
  ('40000000-0000-0000-0000-000000000006','40000000-0000-0000-0000-000000000006',
   '{"sub":"40000000-0000-0000-0000-000000000006","email":"michael.johnson@nursing.edu"}','email',now(),now(),now()),
  ('40000000-0000-0000-0000-000000000007','40000000-0000-0000-0000-000000000007',
   '{"sub":"40000000-0000-0000-0000-000000000007","email":"emily.rodriguez@nursing.edu"}','email',now(),now(),now()),

  -- Students — BSN 2B
  ('40000000-0000-0000-0000-000000000008','40000000-0000-0000-0000-000000000008',
   '{"sub":"40000000-0000-0000-0000-000000000008","email":"lisa.anderson@nursing.edu"}','email',now(),now(),now()),
  ('40000000-0000-0000-0000-000000000009','40000000-0000-0000-0000-000000000009',
   '{"sub":"40000000-0000-0000-0000-000000000009","email":"robert.taylor@nursing.edu"}','email',now(),now(),now()),
  ('40000000-0000-0000-0000-000000000010','40000000-0000-0000-0000-000000000010',
   '{"sub":"40000000-0000-0000-0000-000000000010","email":"jennifer.white@nursing.edu"}','email',now(),now(),now()),
  ('40000000-0000-0000-0000-000000000011','40000000-0000-0000-0000-000000000011',
   '{"sub":"40000000-0000-0000-0000-000000000011","email":"christopher.lee@nursing.edu"}','email',now(),now(),now()),
  ('40000000-0000-0000-0000-000000000012','40000000-0000-0000-0000-000000000012',
   '{"sub":"40000000-0000-0000-0000-000000000012","email":"amanda.garcia@nursing.edu"}','email',now(),now(),now()),

  -- Students — BSN 2C
  ('40000000-0000-0000-0000-000000000013','40000000-0000-0000-0000-000000000013',
   '{"sub":"40000000-0000-0000-0000-000000000013","email":"daniel.brown@nursing.edu"}','email',now(),now(),now()),
  ('40000000-0000-0000-0000-000000000014','40000000-0000-0000-0000-000000000014',
   '{"sub":"40000000-0000-0000-0000-000000000014","email":"jessica.davis@nursing.edu"}','email',now(),now(),now()),
  ('40000000-0000-0000-0000-000000000015','40000000-0000-0000-0000-000000000015',
   '{"sub":"40000000-0000-0000-0000-000000000015","email":"matthew.wilson@nursing.edu"}','email',now(),now(),now()),
  ('40000000-0000-0000-0000-000000000016','40000000-0000-0000-0000-000000000016',
   '{"sub":"40000000-0000-0000-0000-000000000016","email":"ashley.miller@nursing.edu"}','email',now(),now(),now())

ON CONFLICT (provider_id, provider) DO NOTHING;

-- ================================================================
-- STEP 4 — PROFILES
-- ================================================================
INSERT INTO public.profiles (id, full_name, email, role, status)
VALUES
  -- Admin
  ('20000000-0000-0000-0000-000000000001', 'System Admin',         'admin@maternixtrack.edu',    'admin',      'approved'),
  -- Instructors
  ('30000000-0000-0000-0000-000000000001', 'Dr. Sarah Mitchell',   'sarah.mitchell@nursing.edu', 'instructor', 'approved'),
  ('30000000-0000-0000-0000-000000000002', 'Prof. Jennifer Lopez', 'jennifer.lopez@nursing.edu', 'instructor', 'approved'),
  -- Students — BSN 2A
  ('40000000-0000-0000-0000-000000000001', 'Maria Rodriguez',  'maria.rodriguez@nursing.edu',  'student', 'approved'),
  ('40000000-0000-0000-0000-000000000002', 'James Chen',       'james.chen@nursing.edu',       'student', 'approved'),
  ('40000000-0000-0000-0000-000000000003', 'Sarah Thompson',   'sarah.thompson@nursing.edu',   'student', 'approved'),
  ('40000000-0000-0000-0000-000000000004', 'David Kim',        'david.kim@nursing.edu',        'student', 'approved'),
  ('40000000-0000-0000-0000-000000000005', 'Emily Martinez',   'emily.martinez@nursing.edu',   'student', 'approved'),
  ('40000000-0000-0000-0000-000000000006', 'Michael Johnson',  'michael.johnson@nursing.edu',  'student', 'approved'),
  ('40000000-0000-0000-0000-000000000007', 'Emily Rodriguez',  'emily.rodriguez@nursing.edu',  'student', 'approved'),
  -- Students — BSN 2B
  ('40000000-0000-0000-0000-000000000008', 'Lisa Anderson',    'lisa.anderson@nursing.edu',    'student', 'approved'),
  ('40000000-0000-0000-0000-000000000009', 'Robert Taylor',    'robert.taylor@nursing.edu',    'student', 'approved'),
  ('40000000-0000-0000-0000-000000000010', 'Jennifer White',   'jennifer.white@nursing.edu',   'student', 'approved'),
  ('40000000-0000-0000-0000-000000000011', 'Christopher Lee',  'christopher.lee@nursing.edu',  'student', 'approved'),
  ('40000000-0000-0000-0000-000000000012', 'Amanda Garcia',    'amanda.garcia@nursing.edu',    'student', 'approved'),
  -- Students — BSN 2C
  ('40000000-0000-0000-0000-000000000013', 'Daniel Brown',     'daniel.brown@nursing.edu',     'student', 'approved'),
  ('40000000-0000-0000-0000-000000000014', 'Jessica Davis',    'jessica.davis@nursing.edu',    'student', 'approved'),
  ('40000000-0000-0000-0000-000000000015', 'Matthew Wilson',   'matthew.wilson@nursing.edu',   'student', 'approved'),
  ('40000000-0000-0000-0000-000000000016', 'Ashley Miller',    'ashley.miller@nursing.edu',    'student', 'approved')

ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- STEP 5 — INSTRUCTORS table
-- ================================================================
INSERT INTO public.instructors (id, employee_id, department)
VALUES
  ('30000000-0000-0000-0000-000000000001', 'EMP-2024-001', 'Maternal Health'),
  ('30000000-0000-0000-0000-000000000002', 'EMP-2024-002', 'Pediatric Care')
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- STEP 6 — Assign instructors to sections
-- ================================================================
UPDATE public.sections SET instructor_id = '30000000-0000-0000-0000-000000000001'
WHERE id = '10000000-0000-0000-0000-000000000001';  -- BSN 2A → Dr. Sarah Mitchell

UPDATE public.sections SET instructor_id = '30000000-0000-0000-0000-000000000002'
WHERE id = '10000000-0000-0000-0000-000000000002';  -- BSN 2B → Prof. Jennifer Lopez

-- ================================================================
-- STEP 7 — STUDENTS table
-- ================================================================
INSERT INTO public.students (id, student_no, section_id, year_level)
VALUES
  -- BSN 2A
  ('40000000-0000-0000-0000-000000000001', '24-00001', '10000000-0000-0000-0000-000000000001', '2nd Year'),
  ('40000000-0000-0000-0000-000000000002', '24-00002', '10000000-0000-0000-0000-000000000001', '2nd Year'),
  ('40000000-0000-0000-0000-000000000003', '24-00003', '10000000-0000-0000-0000-000000000001', '2nd Year'),
  ('40000000-0000-0000-0000-000000000004', '24-00004', '10000000-0000-0000-0000-000000000001', '2nd Year'),
  ('40000000-0000-0000-0000-000000000005', '24-00005', '10000000-0000-0000-0000-000000000001', '2nd Year'),
  ('40000000-0000-0000-0000-000000000006', '24-00006', '10000000-0000-0000-0000-000000000001', '2nd Year'),
  ('40000000-0000-0000-0000-000000000007', '24-00007', '10000000-0000-0000-0000-000000000001', '2nd Year'),
  -- BSN 2B
  ('40000000-0000-0000-0000-000000000008', '24-00008', '10000000-0000-0000-0000-000000000002', '2nd Year'),
  ('40000000-0000-0000-0000-000000000009', '24-00009', '10000000-0000-0000-0000-000000000002', '2nd Year'),
  ('40000000-0000-0000-0000-000000000010', '24-00010', '10000000-0000-0000-0000-000000000002', '2nd Year'),
  ('40000000-0000-0000-0000-000000000011', '24-00011', '10000000-0000-0000-0000-000000000002', '2nd Year'),
  ('40000000-0000-0000-0000-000000000012', '24-00012', '10000000-0000-0000-0000-000000000002', '2nd Year'),
  -- BSN 2C
  ('40000000-0000-0000-0000-000000000013', '24-00013', '10000000-0000-0000-0000-000000000003', '2nd Year'),
  ('40000000-0000-0000-0000-000000000014', '24-00014', '10000000-0000-0000-0000-000000000003', '2nd Year'),
  ('40000000-0000-0000-0000-000000000015', '24-00015', '10000000-0000-0000-0000-000000000003', '2nd Year'),
  ('40000000-0000-0000-0000-000000000016', '24-00016', '10000000-0000-0000-0000-000000000003', '2nd Year')

ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- DONE — Login credentials summary
-- ================================================================
-- Role        | Email                            | Password
-- ------------|----------------------------------|------------
-- Admin       | admin@maternixtrack.edu          | password123
-- Instructor  | sarah.mitchell@nursing.edu       | password123
-- Instructor  | jennifer.lopez@nursing.edu       | password123
-- Student 2A  | emily.rodriguez@nursing.edu      | password123  ← main test student
-- Student 2A  | maria.rodriguez@nursing.edu      | password123
-- Student 2A  | james.chen@nursing.edu           | password123
-- Student 2A  | sarah.thompson@nursing.edu       | password123
-- Student 2A  | david.kim@nursing.edu            | password123
-- Student 2A  | emily.martinez@nursing.edu       | password123
-- Student 2A  | michael.johnson@nursing.edu      | password123
-- Student 2B  | lisa.anderson@nursing.edu        | password123
-- Student 2B  | robert.taylor@nursing.edu        | password123
-- Student 2B  | jennifer.white@nursing.edu       | password123
-- Student 2B  | christopher.lee@nursing.edu      | password123
-- Student 2B  | amanda.garcia@nursing.edu        | password123
-- Student 2C  | daniel.brown@nursing.edu         | password123
-- Student 2C  | jessica.davis@nursing.edu        | password123
-- Student 2C  | matthew.wilson@nursing.edu       | password123
-- Student 2C  | ashley.miller@nursing.edu        | password123
