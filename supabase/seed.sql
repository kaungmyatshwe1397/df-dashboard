-- ============================================
-- DC-FMS Seed Data (Re-runnable)
-- Run: supabase db seed
-- Safe to re-run — uses ON CONFLICT DO NOTHING
-- ============================================

-- ------------------------------------------
-- Labs
-- ------------------------------------------

INSERT INTO labs (id, lab_name) VALUES
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'Central Lab'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'City Diagnostics'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'Health First Lab')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------
-- Case Types
-- ------------------------------------------

INSERT INTO case_types (id, name) VALUES
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'RPD'),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'Crown'),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'Bridge')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------
-- Cycles
-- ------------------------------------------

INSERT INTO monthly_cycles (id, month_year, status) VALUES
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', '2026-09', 'OPEN'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', '2026-08', 'LOCKED')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------
-- Patient Records (active cycle)
-- ------------------------------------------

-- GP records
INSERT INTO patient_records (id, cycle_id, patient_id, entry_date, patient_name, address, category, diagnosis, total_cost, month_label, is_carried_forward) VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', '0001/26', '2026-09-01', 'John Doe', '123 Main St', 'GP', 'Common cold treatment', 50000, 'Sep 2026', false),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', '0002/26', '2026-09-03', 'Maria Garcia', '456 Oak Ave', 'GP', 'Scaling and cleaning', 35000, 'Sep 2026', false)
ON CONFLICT (id) DO NOTHING;

-- Case records
INSERT INTO patient_records (id, cycle_id, patient_id, entry_date, patient_name, category, diagnosis, total_cost, month_label, lab_name, lab_id, lab_fee, lab_payment_status, paid, remaining, case_type, teeth, is_carried_forward) VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', '0003/26', '2026-09-02', 'Jane Smith', 'CASE', 'RPD at 41,42,43,44', 250000, 'Sep 2026', 'Central Lab', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 30000, 'PAID', 150000, 100000, 'RPD', '41,42,43,44', false),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', '0004/26', '2026-09-04', 'Robert Johnson', 'CASE', 'Crown at 16', 500000, 'Sep 2026', 'City Diagnostics', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 45000, 'UNPAID', 200000, 300000, 'Crown', '16', false),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', '0005/26', '2026-09-05', 'Sarah Wilson', 'CASE', 'Bridge at 21,22', 800000, 'Sep 2026', 'Health First Lab', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 60000, 'UNPAID', 300000, 500000, 'Bridge', '21,22', false)
ON CONFLICT (id) DO NOTHING;

-- Carried-forward record from previous cycle
INSERT INTO patient_records (id, cycle_id, patient_id, entry_date, patient_name, category, diagnosis, total_cost, month_label, lab_name, lab_id, lab_fee, lab_payment_status, paid, remaining, case_type, teeth, is_carried_forward) VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', '0006/25', '2026-08-20', 'Ahmed Hassan', 'CASE', 'RPD at 31,32,33', 350000, 'Sep 2026', 'Central Lab', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 25000, 'PAID', 200000, 150000, 'RPD', '31,32,33', true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------
-- Case Payments
-- ------------------------------------------

INSERT INTO case_payments (id, record_id, payment_date, paid_amount, payment_note, payment_status) VALUES
  ('aaeebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', '2026-09-02', 150000, 'Initial deposit', 'COMPLETED'),
  ('aaeebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', '2026-09-04', 200000, 'First installment', 'COMPLETED'),
  ('aaeebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', '2026-09-05', 300000, 'Deposit payment', 'COMPLETED'),
  ('aaeebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', '2026-08-20', 200000, 'Partial payment last month', 'COMPLETED')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------
-- Monthly Financials (active cycle)
-- ------------------------------------------

INSERT INTO monthly_financials (
  id, cycle_id, total_gp, total_case, gross_income, lab_fee, relieving_fee,
  general_expenses, assistant_fee, bonus, utility_costs, building_rent,
  net_profit, custom_overheads
) VALUES (
  'bbeebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
  85000, 650000, 735000, 160000, 0,
  100000, 80000, 20000, 30000, 150000,
  95000, '[]'::jsonb
) ON CONFLICT (id) DO NOTHING;
