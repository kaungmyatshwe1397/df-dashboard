// One RPC owns the entire visit save so retries cannot leave partial or duplicate receipts.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CasePayment, MonthlyCycle, PatientRecord, PatientSourceType, PatientType } from "@/lib/global";
import { toPatientRecord, toPatientType } from "@/lib/data-helpers";

interface AtomicRecordSaveResultType {
  record: PatientRecord;
  payment: CasePayment | null;
  cycle: MonthlyCycle;
}

export class RecordSaveError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = "RecordSaveError";
  }
}

/** Includes patient creation in the same retry-protected transaction as the visit and receipt. */
export async function savePatientRecord(
  supabase: SupabaseClient,
  submissionId: string,
  patient: PatientSourceType,
  record: Record<string, unknown>,
  initialPayment = 0
): Promise<AtomicRecordSaveResultType & { patient?: PatientType }> {
  if (patient.record_patient) {
    const isCase = record.category === "CASE";
    if ((!isCase && record.category !== "GP") || !Number.isInteger(initialPayment) || initialPayment < 0) {
      throw new Error("Choose GP or Case and a valid initial payment.");
    }
    if (!isCase && initialPayment !== 0) throw new Error("GP records are saved without installments.");
    const { data, error } = await supabase.rpc(isCase ? "save_case_record" : "save_gp_record", {
      p_submission_id: submissionId, p_patient: patient.record_patient, p_record: record,
      ...(isCase ? { p_initial_payment: initialPayment } : {}),
    });
    if (error) throw new RecordSaveError(error.code === "PGRST202"
      ? "Record entry requires the database update before records can be saved. Your draft is preserved."
      : error.message || "Failed to save record. Please try again.", error.code);
    if (!data?.record || !data?.cycle || data.record.category !== record.category || data.record.patient_uuid != null
      || (isCase && initialPayment > 0 && (data.payment?.record_id !== data.record.id || data.payment?.paid_amount !== initialPayment))) {
      throw new Error("Could not confirm the save. Retry with the same values.");
    }
    return { record: toPatientRecord(data.record), cycle: data.cycle, payment: isCase ? data.payment ?? null : null };
  }
  const { data, error } = await supabase.rpc("save_patient_record", {
    p_submission_id: submissionId, p_patient: patient, p_record: record, p_initial_payment: initialPayment,
  });
  if (error) throw new RecordSaveError(error.message || "Failed to save record. Please try again.", error.code);
  if (!data?.record || !data?.cycle || !data?.patient) {
    throw new Error("Could not confirm the save. Retry with the same values.");
  }
  const savedPatient = toPatientType(data.patient);
  return { record: { ...toPatientRecord(data.record), patient: savedPatient }, patient: savedPatient,
    payment: data.payment ?? null, cycle: data.cycle };
}

/** Reuses the caller's submission identity; a successful replay returns the original save. */
export async function saveRegisteredRecord(
  supabase: SupabaseClient,
  submissionId: string,
  patientId: string,
  record: Record<string, unknown>,
  initialPayment = 0
): Promise<AtomicRecordSaveResultType> {
  const { data, error } = await supabase.rpc("save_registered_record", {
    p_submission_id: submissionId,
    p_patient_id: patientId,
    p_record: record,
    p_initial_payment: initialPayment,
  });
  if (error) throw new RecordSaveError(error.message || "Failed to save record. Please try again.", error.code);
  if (!data?.record || !data?.cycle) throw new Error("Could not confirm the save. Retry with the same values.");
  return { record: toPatientRecord(data.record), payment: data.payment ?? null, cycle: data.cycle };
}
