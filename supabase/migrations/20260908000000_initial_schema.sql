-- ============================================
-- DC-FMS Initial Schema
-- Migration: initial_schema
-- Generated from ERD: dc-fms-erd.mmd
-- Consolidated from 5 previous migrations.
-- App handles profile creation (no trigger).
-- ============================================

-- ------------------------------------------
-- Custom ENUM types
-- ------------------------------------------

CREATE TYPE user_role AS ENUM ('ADMIN', 'ASSISTANT');
CREATE TYPE cycle_status AS ENUM ('OPEN', 'LOCKED');
CREATE TYPE record_category AS ENUM ('GP', 'CASE');
CREATE TYPE lab_payment_status AS ENUM ('PAID', 'UNPAID');
CREATE TYPE payment_status AS ENUM ('COMPLETED', 'INCOMPLETE');

-- ------------------------------------------
-- Table: profiles (linked to auth.users)
-- ------------------------------------------

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE profiles IS 'User profiles linked to Supabase Auth. Role determines access level.';

-- ------------------------------------------
-- Table: monthly_cycles
-- ------------------------------------------

CREATE TABLE monthly_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_year TEXT NOT NULL,
  status cycle_status DEFAULT 'OPEN' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE monthly_cycles IS 'Monthly billing periods. One cycle has status OPEN at a time.';

-- ------------------------------------------
-- Table: labs
-- ------------------------------------------

CREATE TABLE labs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_name TEXT NOT NULL
);

COMMENT ON TABLE labs IS 'Reference table of dental laboratories.';

-- ------------------------------------------
-- Table: case_types
-- ------------------------------------------

CREATE TABLE case_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);

COMMENT ON TABLE case_types IS 'Reference table of case types (RPD, Crown, Bridge).';

-- ------------------------------------------
-- Table: patient_records
-- ------------------------------------------

CREATE TABLE patient_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES monthly_cycles(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL,
  entry_date DATE NOT NULL,
  patient_name TEXT NOT NULL,
  address TEXT,
  category record_category NOT NULL,
  diagnosis TEXT NOT NULL,
  total_cost INTEGER NOT NULL,
  month_label TEXT NOT NULL,
  lab_name TEXT,
  lab_send_date DATE,
  delivery_date DATE,
  paid INTEGER DEFAULT 0,
  remaining INTEGER,
  lab_id UUID REFERENCES labs(id) ON DELETE SET NULL,
  lab_fee INTEGER DEFAULT 0,
  lab_payment_status lab_payment_status DEFAULT 'UNPAID',
  case_type TEXT,
  teeth TEXT,
  is_carried_forward BOOLEAN DEFAULT false NOT NULL
);

COMMENT ON TABLE patient_records IS 'Patient treatment records. GP = single-session, Case = multi-installment with lab assignment.';

-- Unique constraint: patient_id unique per cycle
CREATE UNIQUE INDEX idx_patient_records_patient_id_cycle
  ON patient_records (patient_id, cycle_id);

-- ------------------------------------------
-- Table: case_payments
-- ------------------------------------------

CREATE TABLE case_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES patient_records(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  paid_amount INTEGER NOT NULL,
  payment_note TEXT,
  payment_status payment_status DEFAULT 'COMPLETED' NOT NULL
);

COMMENT ON TABLE case_payments IS 'Installment payments for CASE records. Cascade deletes with parent record.';

-- ------------------------------------------
-- Table: monthly_financials
-- ------------------------------------------

CREATE TABLE monthly_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID UNIQUE NOT NULL REFERENCES monthly_cycles(id) ON DELETE CASCADE,
  total_gp INTEGER DEFAULT 0 NOT NULL,
  total_case INTEGER DEFAULT 0 NOT NULL,
  gross_income INTEGER DEFAULT 0 NOT NULL,
  lab_fee INTEGER DEFAULT 0 NOT NULL,
  relieving_fee INTEGER DEFAULT 0 NOT NULL,
  general_expenses INTEGER DEFAULT 0 NOT NULL,
  assistant_fee INTEGER DEFAULT 0 NOT NULL,
  bonus INTEGER DEFAULT 0 NOT NULL,
  utility_costs INTEGER DEFAULT 0 NOT NULL,
  building_rent INTEGER DEFAULT 0 NOT NULL,
  net_profit INTEGER DEFAULT 0 NOT NULL,
  custom_overheads JSONB DEFAULT '[]'::jsonb NOT NULL
);

COMMENT ON TABLE monthly_financials IS 'Monthly financial summary. 1:1 with cycle. custom_overheads stores [{id, name, amount}] array.';

-- ------------------------------------------
-- Indexes
-- ------------------------------------------

CREATE INDEX idx_patient_records_cycle_id ON patient_records (cycle_id);
CREATE INDEX idx_patient_records_category ON patient_records (category);
CREATE INDEX idx_patient_records_month_label ON patient_records (month_label);
CREATE INDEX idx_patient_records_lab_payment_status ON patient_records (lab_payment_status);
CREATE INDEX idx_case_payments_record_id ON case_payments (record_id);
CREATE INDEX idx_monthly_cycles_status ON monthly_cycles (status);

-- ------------------------------------------
-- Helper functions
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

CREATE OR REPLACE FUNCTION get_user_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT auth.uid();
$$;

-- ------------------------------------------
-- Row Level Security
-- ------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_types ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------
-- RLS Policies: profiles
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

-- App can insert own profile (signup flow)
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

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
-- RLS Policies: monthly_cycles
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
-- RLS Policies: patient_records
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
-- RLS Policies: case_payments
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
-- RLS Policies: monthly_financials (Admin ONLY)
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
-- RLS Policies: labs
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
-- RLS Policies: case_types
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
