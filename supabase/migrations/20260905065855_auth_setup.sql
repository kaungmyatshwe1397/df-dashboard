-- ============================================
-- DC-FMS Auth Setup
-- Migration: auth_setup
-- Auto-creates profile on signup, role helper
-- ============================================

-- ------------------------------------------
-- Function: auto-create profile on signup
-- ------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'ASSISTANT')::user_role
  );
  RETURN new;
END;
$$;

COMMENT ON FUNCTION handle_new_user() IS 'Auto-inserts into profiles when a new user signs up via Supabase Auth. Reads username and role from metadata.';

-- ------------------------------------------
-- Trigger: fire after auth.users insert
-- ------------------------------------------

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ------------------------------------------
-- Function: get current user role
-- ------------------------------------------

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

COMMENT ON FUNCTION get_user_role() IS 'Returns the role (ADMIN/ASSISTANT) of the currently authenticated user. Used in RLS policies.';

-- ------------------------------------------
-- Function: get current user id
-- ------------------------------------------

CREATE OR REPLACE FUNCTION get_user_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT auth.uid();
$$;
