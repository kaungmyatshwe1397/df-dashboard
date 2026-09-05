-- ============================================
-- DC-FMS Row Level Security Policies
-- Migration: rls_policies
-- Admin = full access. Assistant = limited.
-- ============================================

-- ------------------------------------------
-- Enable RLS on all tables
-- ------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_types ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------
-- Table: profiles
-- Admin: full access
-- Assistant: read own profile only
-- ------------------------------------------

-- Anyone authenticated can read own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admin can read all profiles
CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  TO authenticated
  USING (get_user_role() = 'ADMIN');

-- Admin can insert profiles (user management)
CREATE POLICY "profiles_insert_admin"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'ADMIN');

-- Admin can update any profile
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'ADMIN');

-- Admin can delete assistant profiles
CREATE POLICY "profiles_delete_admin"
  ON profiles FOR DELETE
  TO authenticated
  USING (get_user_role() = 'ADMIN' AND role = 'ASSISTANT');

-- ------------------------------------------
-- Table: monthly_cycles
-- Admin: full access
-- Assistant: read only
-- ------------------------------------------

CREATE POLICY "cycles_select_admin"
  ON monthly_cycles FOR SELECT
  TO authenticated
  USING (get_user_role() = 'ADMIN');

CREATE POLICY "cycles_select_assistant"
  ON monthly_cycles FOR SELECT
  TO authenticated
  USING (get_user_role() = 'ASSISTANT');

CREATE POLICY "cycles_insert_admin"
  ON monthly_cycles FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'ADMIN');

CREATE POLICY "cycles_update_admin"
  ON monthly_cycles FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'ADMIN');

CREATE POLICY "cycles_delete_admin"
  ON monthly_cycles FOR DELETE
  TO authenticated
  USING (get_user_role() = 'ADMIN');

-- ------------------------------------------
-- Table: patient_records
-- Admin: full access
-- Assistant: full access (active cycle only enforced at app level)
-- ------------------------------------------

CREATE POLICY "records_select_admin"
  ON patient_records FOR SELECT
  TO authenticated
  USING (get_user_role() = 'ADMIN');

CREATE POLICY "records_select_assistant"
  ON patient_records FOR SELECT
  TO authenticated
  USING (get_user_role() = 'ASSISTANT');

CREATE POLICY "records_insert_admin"
  ON patient_records FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'ADMIN');

CREATE POLICY "records_insert_assistant"
  ON patient_records FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'ASSISTANT');

CREATE POLICY "records_update_admin"
  ON patient_records FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'ADMIN');

CREATE POLICY "records_update_assistant"
  ON patient_records FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'ASSISTANT');

CREATE POLICY "records_delete_admin"
  ON patient_records FOR DELETE
  TO authenticated
  USING (get_user_role() = 'ADMIN');

-- ------------------------------------------
-- Table: case_payments
-- Admin: full access
-- Assistant: full access
-- ------------------------------------------

CREATE POLICY "payments_select_admin"
  ON case_payments FOR SELECT
  TO authenticated
  USING (get_user_role() = 'ADMIN');

CREATE POLICY "payments_select_assistant"
  ON case_payments FOR SELECT
  TO authenticated
  USING (get_user_role() = 'ASSISTANT');

CREATE POLICY "payments_insert_admin"
  ON case_payments FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'ADMIN');

CREATE POLICY "payments_insert_assistant"
  ON case_payments FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'ASSISTANT');

CREATE POLICY "payments_update_admin"
  ON case_payments FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'ADMIN');

CREATE POLICY "payments_update_assistant"
  ON case_payments FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'ASSISTANT');

CREATE POLICY "payments_delete_admin"
  ON case_payments FOR DELETE
  TO authenticated
  USING (get_user_role() = 'ADMIN');

-- ------------------------------------------
-- Table: monthly_financials
-- Admin ONLY — assistant has no access
-- ------------------------------------------

CREATE POLICY "financials_select_admin"
  ON monthly_financials FOR SELECT
  TO authenticated
  USING (get_user_role() = 'ADMIN');

CREATE POLICY "financials_insert_admin"
  ON monthly_financials FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'ADMIN');

CREATE POLICY "financials_update_admin"
  ON monthly_financials FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'ADMIN');

CREATE POLICY "financials_delete_admin"
  ON monthly_financials FOR DELETE
  TO authenticated
  USING (get_user_role() = 'ADMIN');

-- ------------------------------------------
-- Table: labs
-- Both roles can read
-- Admin can manage
-- ------------------------------------------

CREATE POLICY "labs_select"
  ON labs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "labs_insert_admin"
  ON labs FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'ADMIN');

CREATE POLICY "labs_update_admin"
  ON labs FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'ADMIN');

CREATE POLICY "labs_delete_admin"
  ON labs FOR DELETE
  TO authenticated
  USING (get_user_role() = 'ADMIN');

-- ------------------------------------------
-- Table: case_types
-- Both roles can read
-- Admin can manage
-- ------------------------------------------

CREATE POLICY "case_types_select"
  ON case_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "case_types_insert_admin"
  ON case_types FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'ADMIN');

CREATE POLICY "case_types_update_admin"
  ON case_types FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'ADMIN');

CREATE POLICY "case_types_delete_admin"
  ON case_types FOR DELETE
  TO authenticated
  USING (get_user_role() = 'ADMIN');
