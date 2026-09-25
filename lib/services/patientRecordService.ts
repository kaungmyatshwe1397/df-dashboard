// Patient + visit-record registration service.
// Wraps the atomic register_patient_with_record RPC and maps
// database errors to friendly messages — keeps this logic out
// of DataContext.

import type { SupabaseClient } from "@supabase/supabase-js";
import { PatientRecord, PatientPayloadType } from "@/lib/global";
import { toPatientRecord } from "@/lib/data-helpers";

export const DUPLICATE_PATIENT_ID_MESSAGE =
  "The patient ID is already registered for another person. Check your patient ID again.";

interface RegisterPatientResult {
  patient_id: string;
  record: Record<string, unknown>;
}

/**
 * Atomically registers a patient (new) or links a returning one, plus a visit record.
 * One RPC call = one transaction — a failure leaves no partial rows.
 * isNewPatient rejects mismatches: duplicate ID (23505) when true,
 * unregistered ID (23503) when false.
 */
export async function registerPatientWithRecord(
  supabase: SupabaseClient,
  patient: PatientPayloadType,
  record: Record<string, unknown>,
  isNewPatient: boolean
): Promise<PatientRecord> {
  const { data, error } = await supabase.rpc("register_patient_with_record", {
    p_patient: patient,
    p_record: record,
    p_is_new_patient: isNewPatient,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error(DUPLICATE_PATIENT_ID_MESSAGE);
    }
    throw new Error(error.message || "Failed to save patient record.");
  }

  const result = data as RegisterPatientResult | null;
  if (!result?.record) {
    throw new Error("Failed to save patient record.");
  }

  return toPatientRecord(result.record);
}
