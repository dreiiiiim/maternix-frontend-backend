-- Email-verification-first flow
-- Inserts profile/role tables only after auth.users email_confirmed_at changes NULL -> value.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone_number TEXT;

CREATE OR REPLACE FUNCTION public.handle_new_user_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    v_role := NEW.raw_user_meta_data->>'role';

    INSERT INTO public.profiles (id, full_name, email, role, status)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      NEW.email,
      COALESCE(v_role, 'student'),
      'pending'
    )
    ON CONFLICT (id) DO NOTHING;

    IF v_role = 'student' THEN
      INSERT INTO public.students (id, student_no, section_id, year_level)
      VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'student_no',
        (NEW.raw_user_meta_data->>'section_id')::UUID,
        COALESCE(NEW.raw_user_meta_data->>'year_level', '2nd Year')
      )
      ON CONFLICT (id) DO NOTHING;
    ELSIF v_role = 'instructor' THEN
      INSERT INTO public.instructors (id, employee_id, department)
      VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'employee_id',
        COALESCE(NEW.raw_user_meta_data->>'department', 'Nursing')
      )
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;

CREATE TRIGGER on_auth_user_email_confirmed
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_confirmed();
