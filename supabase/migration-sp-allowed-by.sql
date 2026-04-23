-- Add allowed_by column to student_procedures to track which instructor unlocked the procedure for a student
ALTER TABLE public.student_procedures ADD COLUMN IF NOT EXISTS allowed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
