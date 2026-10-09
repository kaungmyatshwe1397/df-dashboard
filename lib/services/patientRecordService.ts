// Patient + visit-record registration service.
// Wraps the atomic register_patient_with_record RPC and maps
// database errors to friendly messages — keeps this logic out
// of DataContext.

import type { SupabaseClient } from "@supabase/supabase-js";
import { PatientRecord } from "@/lib/global";
import { toPatientRecord } from "@/lib/data-helpers";

export const UNREGISTERED_PATIENT_MESSAGE =
  "Patient ID is not registered. Register the patient before adding a record.";

interface RegisterPatientResult {
  patient_id: string;
  record: Record<string, unknown>;
}

/**
 * Adds a visit for a registered patient in one transaction.
 * The database rechecks registration so a stale client lookup cannot create a patient.
 */
export async function registerPatientWithRecord(
  supabase: SupabaseClient,
  patientId: string,
  record: Record<string, unknown>
): Promise<PatientRecord> {
  const { data, error } = await supabase.rpc("register_patient_with_record", {
    p_patient: { patient_id: patientId },
    p_record: record,
  });

  if (error) {
    if (
      error.code === "23503" &&
      error.message.includes("Patient ID is not registered")
    ) {
      throw new Error(UNREGISTERED_PATIENT_MESSAGE);
    }
    throw new Error(error.message || "Failed to save patient record.");
  }

  const result = data as RegisterPatientResult | null;
  if (!result?.record) {
    throw new Error("Failed to save patient record.");
  }

  return toPatientRecord(result.record);
}
