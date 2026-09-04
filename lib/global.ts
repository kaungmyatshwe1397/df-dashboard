// ============================================
// DC-FMS TypeScript Types
// Generated from ERD: dc-fms-erd.mmd
// ============================================

// ------------------------------------------
// Enums
// ------------------------------------------

export enum UserRole {
  ADMIN = "ADMIN",
  ASSISTANT = "ASSISTANT",
}

export enum CycleStatus {
  OPEN = "OPEN",
  LOCKED = "LOCKED",
}

export enum RecordCategory {
  GP = "GP",
  CASE = "CASE",
}

export enum LabPaymentStatus {
  PAID = "PAID",
  UNPAID = "UNPAID",
}

export enum PaymentStatus {
  PAID = "COMPLETED",
  UNPAID = "INCOMPLETE",
}

// ------------------------------------------
// Base Interfaces
// ------------------------------------------

export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: UserRole;
}

export interface MonthlyCycle {
  id: string;
  month_year: string;
  status: CycleStatus;
}

export interface Lab {
  id: string;
  lab_name: string;
}

export interface CaseType {
  id: string;
  name: string;
}

// ------------------------------------------
// Patient Record Types
// Split into GP and Case to enforce correct field usage at compile time.
// GP = single-session, Case = multi-installment with lab assignment.
// ------------------------------------------

export interface PatientRecordBaseType {
  id: string;
  cycle_id: string;
  patient_id: string;
  entry_date: string;
  patient_name: string;
  address?: string;
  category: RecordCategory;
  diagnosis: string;
  total_cost: number;
  month_label: string;
}

export interface GPPatientRecordType extends PatientRecordBaseType {
  category: RecordCategory.GP;
}

export interface CasePatientRecordType extends PatientRecordBaseType {
  category: RecordCategory.CASE;
  case_type?: string;
  teeth?: string;
  lab_name: string;
  lab_send_date?: string;
  delivery_date?: string;
  paid?: number;
  remaining?: number;
  lab_id?: string;
  lab_fee?: number;
  lab_payment_status?: LabPaymentStatus;
  is_carried_forward: boolean;
}

export type PatientRecord = GPPatientRecordType | CasePatientRecordType;

export interface CasePayment {
  id: string;
  record_id: string;
  payment_date: string;
  paid_amount: number;
  payment_note?: string;
  payment_status: PaymentStatus;
}

export interface MonthlyFinancials {
  id: string;
  cycle_id: string;
  total_gp: number;
  total_case: number;
  gross_income: number;
  lab_fee: number;
  relieving_fee: number;
  general_expenses: number;
  assistant_fee: number;
  bonus: number;
  utility_costs: number;
  building_rent: number;
  net_profit: number;
}

// ------------------------------------------
// Relationship Types
// ------------------------------------------

export interface PatientRecordWithPayments extends CasePatientRecordType {
  case_payments: CasePayment[];
}

export interface PatientRecordWithLab extends CasePatientRecordType {
  lab?: Lab;
}

export interface MonthlyCycleWithRecords extends MonthlyCycle {
  patient_records: PatientRecord[];
}

export interface MonthlyCycleWithFinancials extends MonthlyCycle {
  monthly_financials: MonthlyFinancials;
}

// ------------------------------------------
// Mock Data Type (mirrors Supabase query results)
// ------------------------------------------

export interface MockData {
  users: User[];
  monthly_cycles: MonthlyCycle[];
  labs: Lab[];
  case_types: CaseType[];
  patient_records: PatientRecord[];
  case_payments: CasePayment[];
  monthly_financials: MonthlyFinancials[];
}

// ------------------------------------------
// Helper Types
// ------------------------------------------

export interface ActiveCycleData {
  cycle: MonthlyCycle;
  records: PatientRecord[];
  financials?: MonthlyFinancials;
}

export interface DashboardKPIs {
  total_gp_revenue: number;
  total_case_revenue: number;
  total_lab_fees: number;
  doctor_commission: number;
  operating_overhead: number;
  net_profit_loss: number;
}
