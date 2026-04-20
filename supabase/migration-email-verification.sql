-- Add email verification fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_token text,
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;

-- Existing approved users (admins, etc.) auto-verified
UPDATE public.profiles SET email_verified = true WHERE status = 'approved';
