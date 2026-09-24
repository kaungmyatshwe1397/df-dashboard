// ============================================
// usePatients — Patient Registry Hook
// ============================================
// Registry lookups and demographic updates.
// Extracted from DataContext to follow Single Responsibility Principle.

import { useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { PatientType, PatientUpdatesType } from "@/lib/global";
import { toPatientType } from "@/lib/data-helpers";

export function usePatients() {
  const supabaseRef = useRef(createClient());

  const findPatientById = useCallback(
    async (patientId: string): Promise<PatientType | null> => {
      const trimmed = patientId.trim();
      if (!trimmed) return null;

      const { data, error } = await supabaseRef.current
        .from("patients")
        .select("*")
        .eq("patient_id", trimmed)
        .maybeSingle();

      if (error) {
        throw new Error(error.message || "Failed to look up patient.");
      }
      return data ? toPatientType(data) : null;
    },
    []
  );

  // Updates the registry row; when name/address change, the same values
  // are propagated to all of this patient's records so tables stay in sync.
  const updatePatient = useCallback(
    async (patientId: string, updates: PatientUpdatesType): Promise<void> => {
      const trimmed = patientId.trim();
      if (!trimmed) throw new Error("Patient ID is required.");

      const { error } = await supabaseRef.current
        .from("patients")
        .update(updates)
        .eq("patient_id", trimmed);

      if (error) {
        throw new Error(error.message || "Failed to update patient.");
      }

      const propagate: Record<string, string | null> = {};
      if (updates.patient_name !== undefined) {
        propagate.patient_name = updates.patient_name;
      }
      if (updates.address !== undefined) {
        propagate.address = updates.address;
      }

      if (Object.keys(propagate).length > 0) {
        const { error: recordsError } = await supabaseRef.current
          .from("patient_records")
          .update(propagate)
          .eq("patient_id", trimmed);

        if (recordsError) {
          throw new Error(
            recordsError.message || "Failed to update patient records."
          );
        }
      }
    },
    []
  );

  return { findPatientById, updatePatient };
}
