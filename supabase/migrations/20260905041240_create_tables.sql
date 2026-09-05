-- database: :memory:
-- ============================================
-- DC-FMS Database Schema
-- Migration: create_tables
-- Generated from ERD: dc-fms-erd.mmd
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
  -- CASE-only fields
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
-- Indexes for frequently queried columns
-- ------------------------------------------

CREATE INDEX idx_patient_records_cycle_id ON patient_records (cycle_id);
CREATE INDEX idx_patient_records_category ON patient_records (category);
CREATE INDEX idx_patient_records_month_label ON patient_records (month_label);
CREATE INDEX idx_patient_records_lab_payment_status ON patient_records (lab_payment_status);
CREATE INDEX idx_case_payments_record_id ON case_payments (record_id);
CREATE INDEX idx_monthly_cycles_status ON monthly_cycles (status);
