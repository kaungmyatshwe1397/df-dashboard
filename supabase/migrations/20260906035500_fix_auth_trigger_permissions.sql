-- ============================================
-- DC-FMS Fix Auth + Profile Creation
-- Migration: fix_auth_trigger_permissions
-- 
-- The handle_new_user trigger on auth.users fails
-- on hosted Supabase due to internal permission issues.
-- Fix: drop the trigger and add RLS policy so the
-- app can insert profiles directly after signUp.
-- ============================================

-- Remove broken trigger (app handles profile creation now)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Allow authenticated users to insert their own profile (for signup flow)
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());
