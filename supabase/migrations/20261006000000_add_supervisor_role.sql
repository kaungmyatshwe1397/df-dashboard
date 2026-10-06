-- Add SUPERVISOR role: read-only access to the full dashboard.
-- Supervisors can SELECT from all operational tables but never
-- INSERT/UPDATE/DELETE. Admin and Assistant policies stay unchanged.

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SUPERVISOR';

-- Recreate SELECT policies to include SUPERVISOR.
DROP POLICY IF EXISTS "cycles_select" ON monthly_cycles;
CREATE POLICY "cycles_select"
  ON monthly_cycles FOR SELECT
  TO authenticated
  USING (get_user_role() IN ('ADMIN', 'ASSISTANT', 'SUPERVISOR'));

DROP POLICY IF EXISTS "records_select" ON patient_records;
CREATE POLICY "records_select"
  ON patient_records FOR SELECT
  TO authenticated
  USING (get_user_role() IN ('ADMIN', 'ASSISTANT', 'SUPERVISOR'));

DROP POLICY IF EXISTS "payments_select" ON case_payments;
CREATE POLICY "payments_select"
  ON case_payments FOR SELECT
  TO authenticated
  USING (get_user_role() IN ('ADMIN', 'ASSISTANT', 'SUPERVISOR'));

DROP POLICY IF EXISTS "financials_select_admin" ON monthly_financials;
CREATE POLICY "financials_select_admin"
  ON monthly_financials FOR SELECT
  TO authenticated
  USING (get_user_role() IN ('ADMIN', 'SUPERVISOR'));

DROP POLICY IF EXISTS "patients_select" ON patients;
CREATE POLICY "patients_select"
  ON patients FOR SELECT
  TO authenticated
  USING (get_user_role() IN ('ADMIN', 'ASSISTANT', 'SUPERVISOR'));
