// ============================================
// DC-FMS Mock Data
// For development only — Supabase will replace this
// ============================================

import {
  User,
  UserRole,
  MonthlyCycle,
  CycleStatus,
  PatientRecord,
  RecordCategory,
  CasePayment,
  PaymentStatus,
  MonthlyFinancials,
  Lab,
  LabPaymentStatus,
  MockData,
} from "./global";

// ------------------------------------------
// Mock Users
// ------------------------------------------

export const MOCK_USERS: User[] = [
  {
    id: "user-001",
    username: "admin",
    password_hash: "admin123",
    role: UserRole.ADMIN,
  },
  {
    id: "user-002",
    username: "assistant",
    password_hash: "assist123",
    role: UserRole.ASSISTANT,
  },
];

// ------------------------------------------
// Mock Labs
// ------------------------------------------

export const MOCK_LABS: Lab[] = [
  { id: "lab-001", lab_name: "Central Lab" },
  { id: "lab-002", lab_name: "City Diagnostics" },
  { id: "lab-003", lab_name: "Health First Lab" },
];

// ------------------------------------------
// Mock Cycles
// ------------------------------------------

export const MOCK_CYCLES: MonthlyCycle[] = [
  {
    id: "cycle-001",
    month_year: "2026-09",
    status: CycleStatus.OPEN,
  },
  {
    id: "cycle-002",
    month_year: "2026-08",
    status: CycleStatus.CLOSED,
  },
];

// ------------------------------------------
// Mock Patient Records
// ------------------------------------------

export const MOCK_PATIENT_RECORDS: PatientRecord[] = [
  // Active cycle records
  {
    id: "rec-001",
    cycle_id: "cycle-001",
    patient_id: "0001/26",
    entry_date: "2026-09-01",
    patient_name: "John Doe",
    address: "123 Main St",
    category: RecordCategory.GP,
    diagnosis: "Common cold",
    total_cost: 50000,
    is_carried_forward: false,
  },
  {
    id: "rec-002",
    cycle_id: "cycle-001",
    patient_id: "0002/26",
    entry_date: "2026-09-02",
    patient_name: "Jane Smith",
    category: RecordCategory.CASE,
    diagnosis: "Fracture - left arm",
    total_cost: 250000,
    lab_id: "lab-001",
    lab_fee: 30000,
    lab_payment_status: LabPaymentStatus.PAID,
    is_carried_forward: false,
  },
  {
    id: "rec-003",
    cycle_id: "cycle-001",
    patient_id: "0003/26",
    entry_date: "2026-09-03",
    patient_name: "Robert Johnson",
    address: "456 Oak Ave",
    category: RecordCategory.CASE,
    diagnosis: "Appendectomy",
    total_cost: 500000,
    is_carried_forward: false,
  },
  // Carried forward from previous cycle
  {
    id: "rec-004",
    cycle_id: "cycle-001",
    patient_id: "0004/26",
    entry_date: "2026-08-25",
    patient_name: "Maria Garcia",
    category: RecordCategory.CASE,
    diagnosis: "Knee surgery",
    total_cost: 800000,
    lab_id: "lab-002",
    lab_fee: 50000,
    lab_payment_status: LabPaymentStatus.UNPAID,
    is_carried_forward: true,
  },
];

// ------------------------------------------
// Mock Case Payments
// ------------------------------------------

export const MOCK_CASE_PAYMENTS: CasePayment[] = [
  // Payments for Jane Smith (rec-002)
  {
    id: "pay-001",
    record_id: "rec-002",
    payment_date: "2026-09-02",
    paid_amount: 150000,
    payment_note: "Initial payment",
    payment_status: PaymentStatus.PAID,
  },
  {
    id: "pay-002",
    record_id: "rec-002",
    payment_date: "2026-09-10",
    paid_amount: 100000,
    payment_note: "Final payment",
    payment_status: PaymentStatus.PAID,
  },
  // Payments for Robert Johnson (rec-003) - partial
  {
    id: "pay-003",
    record_id: "rec-003",
    payment_date: "2026-09-03",
    paid_amount: 200000,
    payment_note: "First installment",
    payment_status: PaymentStatus.PAID,
  },
  // Payments for Maria Garcia (rec-004) - carried forward
  {
    id: "pay-004",
    record_id: "rec-004",
    payment_date: "2026-08-25",
    paid_amount: 300000,
    payment_note: "Partial payment last month",
    payment_status: PaymentStatus.PAID,
  },
];

// ------------------------------------------
// Mock Monthly Financials
// ------------------------------------------

export const MOCK_MONTHLY_FINANCIALS: MonthlyFinancials[] = [
  {
    id: "fin-001",
    cycle_id: "cycle-001",
    total_gp: 50000,
    total_case: 550000,
    gross_income: 600000,
    lab_fee: 80000,
    relieving_fee: 50000,
    general_expenses: 100000,
    assistant_fee: 80000,
    bonus: 20000,
    utility_costs: 30000,
    building_rent: 150000,
    net_profit: 90000,
  },
];

// ------------------------------------------
// Complete Mock Data
// ------------------------------------------

export const MOCK_DATA: MockData = {
  users: MOCK_USERS,
  monthly_cycles: MOCK_CYCLES,
  labs: MOCK_LABS,
  patient_records: MOCK_PATIENT_RECORDS,
  case_payments: MOCK_CASE_PAYMENTS,
  monthly_financials: MOCK_MONTHLY_FINANCIALS,
};

// ------------------------------------------
// Auth Helpers
// ------------------------------------------

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
}

export function authenticateUser(
  username: string,
  password: string
): AuthUser | null {
  const user = MOCK_USERS.find(
    (u) => u.username === username && u.password_hash === password
  );

  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    role: user.role,
  };
}

// ------------------------------------------
// Data Helpers
// ------------------------------------------

export function getActiveCycle(): MonthlyCycle | undefined {
  return MOCK_CYCLES.find((c) => c.status === CycleStatus.OPEN);
}

export function getRecordsByCycle(cycleId: string): PatientRecord[] {
  return MOCK_PATIENT_RECORDS.filter((r) => r.cycle_id === cycleId);
}

export function getPaymentsByRecord(recordId: string): CasePayment[] {
  return MOCK_CASE_PAYMENTS.filter((p) => p.record_id === recordId);
}

export function getFinancialsByCycle(
  cycleId: string
): MonthlyFinancials | undefined {
  return MOCK_MONTHLY_FINANCIALS.find((f) => f.cycle_id === cycleId);
}
