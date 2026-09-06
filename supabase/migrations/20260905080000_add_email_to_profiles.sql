-- ============================================
-- DC-FMS Add Email to Profiles
-- Migration: add_email_to_profiles
-- Adds email column to profiles for user management display.
-- ============================================

-- Add email column
ALTER TABLE profiles ADD COLUMN email TEXT;

-- Backfill from auth.users
UPDATE profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id AND p.email IS NULL;

-- Make email NOT NULL after backfill
ALTER TABLE profiles ALTER COLUMN email SET NOT NULL;

-- Add unique constraint
ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- Update trigger to include email
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', new.email),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'ASSISTANT')::user_role
  );
  RETURN new;
END;
$$;

COMMENT ON FUNCTION handle_new_user() IS 'Auto-inserts into profiles when a new user signs up via Supabase Auth. Reads username, email, and role.';
