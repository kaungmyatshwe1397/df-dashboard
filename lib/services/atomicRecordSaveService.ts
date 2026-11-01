// One RPC owns the entire visit save so retries cannot leave partial or duplicate receipts.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CasePayment, MonthlyCycle, PatientRecord, PatientSourceType, PatientType } from "@/lib/global";
import { toPatientRecord, toPatientType } from "@/lib/data-helpers";

interface AtomicRecordSaveResultType {
  record: PatientRecord;
  payment: CasePayment | null;
  cycle: MonthlyCycle;
}

/** Includes patient creation in the same retry-protected transaction as the visit and receipt. */
export async function savePatientRecord(
  supabase: SupabaseClient,
  submissionId: string,
  patient: PatientSourceType,
  record: Record<string, unknown>,
  initialPayment = 0
): Promise<AtomicRecordSaveResultType & { patient: PatientType }> {
  const { data, error } = await supabase.rpc("save_patient_record", {
    p_submission_id: submissionId, p_patient: patient, p_record: record, p_initial_payment: initialPayment,
  });
  if (error) throw new Error(error.message || "Failed to save record. Please try again.");
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
  if (error) throw new Error(error.message || "Failed to save record. Please try again.");
  if (!data?.record || !data?.cycle) throw new Error("Could not confirm the save. Retry with the same values.");
  return { record: toPatientRecord(data.record), payment: data.payment ?? null, cycle: data.cycle };
}
