-- ================================================================
-- STUDENT ID MIGRATION SCRIPT
-- Converts 'NSG-2024-001' -> '24-00001'
-- ================================================================

-- 1. Update the students table
UPDATE public.students
SET student_no = 
    -- Take the last 2 digits of the year (e.g., '24' from 'NSG-2024-')
    SUBSTRING(student_no FROM 7 FOR 2) || '-' || 
    -- Take the numeric sequence and pad it to 5 digits (e.g., '00001' from '001')
    LPAD(SPLIT_PART(student_no, '-', 3), 5, '0')
WHERE student_no LIKE 'NSG-%';

-- 2. (Optional) If you have student_no stored in raw_user_meta_data in auth.users,
-- you may want to update that as well to keep them in sync, 
-- though the 'students' table is the primary source of truth for the app.
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || 
    jsonb_build_object('student_no', 
        SUBSTRING(raw_user_meta_data->>'student_no' FROM 7 FOR 2) || '-' || 
        LPAD(SPLIT_PART(raw_user_meta_data->>'student_no', '-', 3), 5, '0')
    )
WHERE raw_user_meta_data->>'student_no' LIKE 'NSG-%';
