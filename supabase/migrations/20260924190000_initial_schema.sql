-- ============================================
-- DC-FMS Initial Schema (consolidated)
-- Single clean migration replacing the previous 5-file chain
-- (initial + trigger + disable-RLS + re-enable-RLS + patients).
--
-- Product decisions reflected here:
--   * monthly_cycles is a PASSIVE month bucket — no OPEN/LOCKED
--     status; cycles are auto-created by the app on first record
--     or during carry-forward. month_year is UNIQUE.
--   * Unsettled CASE balances are carried forward manually
--     (no month-end lock/close/purge workflow).
--   * patient_id is globally unique on patients; visit records
--     reference it (many records per person).
--   * RLS is on for every table; ASSISTANT may create cycles so
--     the first record of a month never fails.
-- ============================================

-- ------------------------------------------
-- Custom ENUM types
-- ------------------------------------------

CREATE TYPE user_role AS ENUM ('ADMIN', 'ASSISTANT');
CREATE TYPE record_category AS ENUM ('GP', 'CASE');
CREATE TYPE lab_payment_status AS ENUM ('PAID', 'UNPAID');
CREATE TYPE payment_status AS ENUM ('COMPLETED', 'INCOMPLETE');
CREATE TYPE gender AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- ------------------------------------------
-- Table: profiles (linked to auth.users)
-- ------------------------------------------

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS 'User profiles linked to Supabase Auth. Email is the unique identifier; username is display-only. Role determines access level.';

-- ------------------------------------------
-- Table: labs / case_types (reference data)
-- ------------------------------------------

CREATE TABLE labs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_name TEXT NOT NULL
);

COMMENT ON TABLE labs IS 'Reference table of dental laboratories.';

CREATE TABLE case_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);

COMMENT ON TABLE case_types IS 'Reference table of case types (RPD, Crown, Bridge).';

-- ------------------------------------------
-- Table: medical_history_options (dynamic picklist)
-- ------------------------------------------

CREATE TABLE medical_history_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

COMMENT ON TABLE medical_history_options IS 'Dynamic picklist for patients.past_medical_history. Admin can add/edit/remove.';

INSERT INTO medical_history_options (name) VALUES
  ('Heart Disease'),
  ('Hypertension'),
  ('Diabetes'),
  ('RA'),
  ('TB'),
  ('Hepatitis B'),
  ('Hepatitis C'),
  ('R'),
  ('Stroke'),
  ('SLE'),
  ('Asthma')
ON CONFLICT (name) DO NOTHING;

-- ------------------------------------------
-- Table: patients (registry, global uniqueness)
-- ------------------------------------------

CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT NOT NULL UNIQUE,
  patient_name TEXT NOT NULL,
  age SMALLINT NOT NULL CHECK (age >= 0 AND age <= 120),
  gender gender NOT NULL,
  address TEXT,
  drug_allergy TEXT,
  past_dental_history TEXT,
  current_medications TEXT[] NOT NULL DEFAULT '{}',
  past_medical_history TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE patients IS 'Patient registry. patient_id is globally unique forever (e.g. 0001/26). One row per person; many visit records per patient.';
COMMENT ON COLUMN patients.past_medical_history IS 'Snapshot of selected medical_history_options names — resilient to later option edits.';
COMMENT ON COLUMN patients.current_medications IS 'Free-form medication names entered as a list.';

-- ------------------------------------------
-- Table: monthly_cycles (passive month buckets)
-- ------------------------------------------

CREATE TABLE monthly_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_year TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE monthly_cycles IS 'Passive month bucket (e.g. 2026-09). No lock/close status. Auto-created on first record of a month or by carry-forward.';

-- ------------------------------------------
-- Table: patient_records
-- ------------------------------------------

CREATE TABLE patient_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES monthly_cycles(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(patient_id),
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
  is_carried_forward BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE patient_records IS 'Patient treatment records. GP = single-session, Case = multi-installment with lab assignment. patient_id FK → patients (many visits per person).';

-- ------------------------------------------
-- Table: case_payments
-- ------------------------------------------

CREATE TABLE case_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES patient_records(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  paid_amount INTEGER NOT NULL,
  payment_note TEXT,
  payment_status payment_status NOT NULL DEFAULT 'COMPLETED'
);

COMMENT ON TABLE case_payments IS 'Installment payments for CASE records. Cascade deletes with parent record.';

-- ------------------------------------------
-- Table: monthly_financials
-- ------------------------------------------

CREATE TABLE monthly_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID UNIQUE NOT NULL REFERENCES monthly_cycles(id) ON DELETE CASCADE,
  total_gp INTEGER NOT NULL DEFAULT 0,
  total_case INTEGER NOT NULL DEFAULT 0,
  gross_income INTEGER NOT NULL DEFAULT 0,
  lab_fee INTEGER NOT NULL DEFAULT 0,
  relieving_fee INTEGER NOT NULL DEFAULT 0,
  general_expenses INTEGER NOT NULL DEFAULT 0,
  assistant_fee INTEGER NOT NULL DEFAULT 0,
  bonus INTEGER NOT NULL DEFAULT 0,
  utility_costs INTEGER NOT NULL DEFAULT 0,
  building_rent INTEGER NOT NULL DEFAULT 0,
  net_profit INTEGER NOT NULL DEFAULT 0,
  custom_overheads JSONB NOT NULL DEFAULT '[]'::jsonb
);

COMMENT ON TABLE monthly_financials IS 'Monthly financial summary. 1:1 with cycle. custom_overheads stores [{id, name, amount}] array.';

-- ------------------------------------------
-- Indexes
-- ------------------------------------------

CREATE INDEX idx_patient_records_cycle_id ON patient_records (cycle_id);
CREATE INDEX idx_patient_records_category ON patient_records (category);
CREATE INDEX idx_patient_records_month_label ON patient_records (month_label);
CREATE INDEX idx_patient_records_lab_payment_status ON patient_records (lab_payment_status);
CREATE INDEX idx_patient_records_patient_id ON patient_records (patient_id);
CREATE INDEX idx_case_payments_record_id ON case_payments (record_id);

-- ------------------------------------------
-- Helper functions (used by RLS policies)
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
-- Profile auto-creation on signup
-- ------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    'ASSISTANT'::public.user_role
  );
  RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

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
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_history_options ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------
-- RLS Policies: profiles
-- ------------------------------------------

CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  TO authenticated
  USING (get_user_role() = 'ADMIN');

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_insert_admin"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'ADMIN');

CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'ADMIN');

CREATE POLICY "profiles_delete_admin"
  ON profiles FOR DELETE
  TO authenticated
  USING (get_user_role() = 'ADMIN' AND role = 'ASSISTANT');

-- ------------------------------------------
-- RLS Policies: monthly_cycles
-- Both roles read; BOTH roles may insert (cycles are passive
-- buckets auto-created when the first record of a month is saved).
-- ------------------------------------------

CREATE POLICY "cycles_select"
  ON monthly_cycles FOR SELECT
  TO authenticated
  USING (get_user_role() IN ('ADMIN', 'ASSISTANT'));

CREATE POLICY "cycles_insert"
  ON monthly_cycles FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() IN ('ADMIN', 'ASSISTANT'));

CREATE POLICY "cycles_update_admin"
  ON monthly_cycles FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'ADMIN');

CREATE POLICY "cycles_delete_admin"
  ON monthly_cycles FOR DELETE
  TO authenticated
  USING (get_user_role() = 'ADMIN');

-- ------------------------------------------
-- RLS Policies: patient_records (both roles; delete = both roles)
-- ------------------------------------------

CREATE POLICY "records_select"
  ON patient_records FOR SELECT
  TO authenticated
  USING (get_user_role() IN ('ADMIN', 'ASSISTANT'));

CREATE POLICY "records_insert"
  ON patient_records FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() IN ('ADMIN', 'ASSISTANT'));

CREATE POLICY "records_update"
  ON patient_records FOR UPDATE
  TO authenticated
  USING (get_user_role() IN ('ADMIN', 'ASSISTANT'));

-- Assistant can delete records; patients registry delete stays admin-only.
CREATE POLICY "records_delete"
  ON patient_records FOR DELETE
  TO authenticated
  USING (get_user_role() IN ('ADMIN', 'ASSISTANT'));

-- ------------------------------------------
-- RLS Policies: case_payments (both roles)
-- ------------------------------------------

CREATE POLICY "payments_select"
  ON case_payments FOR SELECT
  TO authenticated
  USING (get_user_role() IN ('ADMIN', 'ASSISTANT'));

CREATE POLICY "payments_insert"
  ON case_payments FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() IN ('ADMIN', 'ASSISTANT'));

CREATE POLICY "payments_update"
  ON case_payments FOR UPDATE
  TO authenticated
  USING (get_user_role() IN ('ADMIN', 'ASSISTANT'));

CREATE POLICY "payments_delete"
  ON case_payments FOR DELETE
  TO authenticated
  USING (get_user_role() IN ('ADMIN', 'ASSISTANT'));

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
-- RLS Policies: labs / case_types
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

-- ------------------------------------------
-- RLS Policies: patients registry
-- Both roles read/insert/update (identity edits propagate to
-- records in the app layer); delete is admin-only so the
-- assistant can never remove a person from the registry.
-- ------------------------------------------

CREATE POLICY "patients_select"
  ON patients FOR SELECT
  TO authenticated
  USING (get_user_role() IN ('ADMIN', 'ASSISTANT'));

CREATE POLICY "patients_insert"
  ON patients FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() IN ('ADMIN', 'ASSISTANT'));

CREATE POLICY "patients_update"
  ON patients FOR UPDATE
  TO authenticated
  USING (get_user_role() IN ('ADMIN', 'ASSISTANT'))
  WITH CHECK (get_user_role() IN ('ADMIN', 'ASSISTANT'));

CREATE POLICY "patients_delete_admin"
  ON patients FOR DELETE
  TO authenticated
  USING (get_user_role() = 'ADMIN');

-- ------------------------------------------
-- RLS Policies: medical_history_options
-- ------------------------------------------

CREATE POLICY "medical_history_options_select"
  ON medical_history_options FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "medical_history_options_insert_admin"
  ON medical_history_options FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'ADMIN');

CREATE POLICY "medical_history_options_update_admin"
  ON medical_history_options FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'ADMIN');

CREATE POLICY "medical_history_options_delete_admin"
  ON medical_history_options FOR DELETE
  TO authenticated
  USING (get_user_role() = 'ADMIN');

-- ------------------------------------------
-- RPC: register_patient_with_record
-- Single transaction — either patient+record both commit,
-- or neither (no ghost rows on failure).
-- ------------------------------------------

CREATE OR REPLACE FUNCTION register_patient_with_record(
  p_patient jsonb,
  p_record jsonb,
  p_is_new_patient boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_patient_id TEXT := NULLIF(BTRIM(p_patient->>'patient_id'), '');
  v_patient_uuid UUID;
  v_patient_name TEXT;
  v_address TEXT;
  v_record jsonb;
BEGIN
  IF v_patient_id IS NULL THEN
    RAISE EXCEPTION 'Patient ID is required.' USING ERRCODE = '23502';
  END IF;

  SELECT id, patient_name, address
    INTO v_patient_uuid, v_patient_name, v_address
    FROM patients WHERE patient_id = v_patient_id;

  IF p_is_new_patient THEN
    IF v_patient_uuid IS NOT NULL THEN
      RAISE EXCEPTION 'The patient ID is already registered for another person. Check your patient ID again.'
        USING ERRCODE = '23505';
    END IF;

    BEGIN
      INSERT INTO patients (
        patient_id, patient_name, age, gender, address,
        drug_allergy, past_dental_history,
        current_medications, past_medical_history
      )
      VALUES (
        v_patient_id,
        NULLIF(BTRIM(p_patient->>'patient_name'), ''),
        (p_patient->>'age')::smallint,
        (p_patient->>'gender')::gender,
        NULLIF(BTRIM(p_patient->>'address'), ''),
        NULLIF(BTRIM(p_patient->>'drug_allergy'), ''),
        NULLIF(BTRIM(p_patient->>'past_dental_history'), ''),
        COALESCE(
          ARRAY(SELECT jsonb_array_elements_text(p_patient->'current_medications')),
          '{}'
        ),
        COALESCE(
          ARRAY(SELECT jsonb_array_elements_text(p_patient->'past_medical_history')),
          '{}'
        )
      )
      RETURNING id, patient_name, address
        INTO v_patient_uuid, v_patient_name, v_address;
    EXCEPTION WHEN unique_violation THEN
      RAISE EXCEPTION 'The patient ID is already registered for another person. Check your patient ID again.'
        USING ERRCODE = '23505';
    END;
  ELSIF v_patient_uuid IS NULL THEN
    RAISE EXCEPTION 'Patient ID is not registered.' USING ERRCODE = '23503';
  END IF;

  INSERT INTO patient_records (
    cycle_id, patient_id, entry_date, patient_name, address,
    category, diagnosis, total_cost, month_label,
    lab_name, lab_send_date, delivery_date,
    paid, remaining, case_type, teeth, is_carried_forward
  )
  VALUES (
    (p_record->>'cycle_id')::uuid,
    v_patient_id,
    (p_record->>'entry_date')::date,
    v_patient_name,
    NULLIF(BTRIM(v_address), ''),
    (p_record->>'category')::record_category,
    p_record->>'diagnosis',
    (p_record->>'total_cost')::integer,
    p_record->>'month_label',
    NULLIF(BTRIM(p_record->>'lab_name'), ''),
    (p_record->>'lab_send_date')::date,
    (p_record->>'delivery_date')::date,
    COALESCE((p_record->>'paid')::integer, 0),
    (p_record->>'remaining')::integer,
    NULLIF(BTRIM(p_record->>'case_type'), ''),
    NULLIF(BTRIM(p_record->>'teeth'), ''),
    COALESCE((p_record->>'is_carried_forward')::boolean, false)
  )
  RETURNING to_jsonb(patient_records.*) INTO v_record;

  RETURN jsonb_build_object('patient_id', v_patient_uuid, 'record', v_record);
END;
$$;

COMMENT ON FUNCTION register_patient_with_record(jsonb, jsonb, boolean) IS
  'Atomic: p_is_new_patient = true inserts the patient (existing ID raises 23505); false requires an existing registry row (missing ID raises 23503) and writes the registry''s name/address onto the visit record. Patient and record commit together or not at all.';
