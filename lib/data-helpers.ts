// Pure helper functions extracted from DataContext for testability.
// No side effects — data in, data out.

import {
  PatientRecord,
  RecordCategory,
  CasePatientRecordType,
  CustomOverhead,
  Gender,
  PatientType,
  MedicalHistoryOptionType,
} from "./global";

export function getMonthLabel(monthYear: string): string {
  const [year, month] = monthYear.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

export function getNextMonthLabel(current: string): string {
  const [year, month] = current.split("-").map(Number);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
}

export function toPatientRecord(row: Record<string, unknown>): PatientRecord {
  if (row.category === "CASE") {
    return {
      id: row.id as string,
      cycle_id: row.cycle_id as string,
      patient_id: row.patient_id as string,
      entry_date: row.entry_date as string,
      patient_name: row.patient_name as string,
      address: row.address as string | undefined,
      category: RecordCategory.CASE,
      diagnosis: row.diagnosis as string,
      total_cost: row.total_cost as number,
      month_label: row.month_label as string,
      lab_name: row.lab_name as string,
      lab_send_date: row.lab_send_date as string | undefined,
      delivery_date: row.delivery_date as string | undefined,
      paid: row.paid as number | undefined,
      remaining: row.remaining as number | undefined,
      lab_id: row.lab_id as string | undefined,
      lab_fee: row.lab_fee as number | undefined,
      lab_payment_status: row.lab_payment_status as "PAID" | "UNPAID" | undefined,
      case_type: row.case_type as string | undefined,
      teeth: row.teeth as string | undefined,
      is_carried_forward: row.is_carried_forward as boolean,
    } as CasePatientRecordType;
  }
  return {
    id: row.id as string,
    cycle_id: row.cycle_id as string,
    patient_id: row.patient_id as string,
    entry_date: row.entry_date as string,
    patient_name: row.patient_name as string,
    address: row.address as string | undefined,
    category: RecordCategory.GP,
    diagnosis: row.diagnosis as string,
    total_cost: row.total_cost as number,
    month_label: row.month_label as string,
  };
}

export function toPatientType(row: Record<string, unknown>): PatientType {
  return {
    id: row.id as string,
    patient_id: row.patient_id as string,
    patient_name: row.patient_name as string,
    age: row.age as number,
    gender: row.gender as Gender,
    address: (row.address as string | null) ?? undefined,
    drug_allergy: (row.drug_allergy as string | null) ?? undefined,
    past_dental_history: (row.past_dental_history as string | null) ?? undefined,
    current_medications: (row.current_medications as string[] | null) ?? [],
    past_medical_history: (row.past_medical_history as string[] | null) ?? [],
    created_at: row.created_at as string | undefined,
  };
}

export function toMedicalHistoryOptions(
  rows: Record<string, unknown>[]
): MedicalHistoryOptionType[] {
  return rows.map((r) => ({ id: r.id as string, name: r.name as string }));
}

export function toCustomOverhead(raw: unknown): CustomOverhead[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as CustomOverhead[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}
