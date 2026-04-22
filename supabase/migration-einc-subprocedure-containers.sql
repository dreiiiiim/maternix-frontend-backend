-- Add separate EINC procedure containers while reusing the same evaluation rubric in the app.
-- Safe to run multiple times.

INSERT INTO public.procedures (id, name, category, description, created_by)
SELECT
  '50000000-0000-0000-0000-000000000007',
  'EINC - Anthropometric Measurements',
  'Newborn Care',
  'Anthropometric measurements step within the Early and Immediate Newborn Care workflow.',
  (
    SELECT id
    FROM public.profiles
    WHERE role = 'instructor' AND status = 'approved'
    ORDER BY created_at ASC
    LIMIT 1
  )
WHERE NOT EXISTS (
  SELECT 1
  FROM public.procedures
  WHERE id = '50000000-0000-0000-0000-000000000007'
     OR name = 'EINC - Anthropometric Measurements'
);

INSERT INTO public.procedures (id, name, category, description, created_by)
SELECT
  '50000000-0000-0000-0000-000000000008',
  'EINC - Crede''s Prophylaxis',
  'Newborn Care',
  'Crede''s prophylaxis step within the Early and Immediate Newborn Care workflow.',
  (
    SELECT id
    FROM public.profiles
    WHERE role = 'instructor' AND status = 'approved'
    ORDER BY created_at ASC
    LIMIT 1
  )
WHERE NOT EXISTS (
  SELECT 1
  FROM public.procedures
  WHERE id = '50000000-0000-0000-0000-000000000008'
     OR name = 'EINC - Crede''s Prophylaxis'
);

INSERT INTO public.procedures (id, name, category, description, created_by)
SELECT
  '50000000-0000-0000-0000-000000000009',
  'EINC - Infant Bath',
  'Newborn Care',
  'Infant bath step within the Early and Immediate Newborn Care workflow.',
  (
    SELECT id
    FROM public.profiles
    WHERE role = 'instructor' AND status = 'approved'
    ORDER BY created_at ASC
    LIMIT 1
  )
WHERE NOT EXISTS (
  SELECT 1
  FROM public.procedures
  WHERE id = '50000000-0000-0000-0000-000000000009'
     OR name = 'EINC - Infant Bath'
);
