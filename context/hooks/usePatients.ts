// UUID-based patient operations keep clinic registration separate from person identity.
import { useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PatientType, PatientUpdatesType, PatientPayloadType, PatientFiltersType, PatientSearchResultType, NewPatientPayloadType } from "@/lib/global";
import { toPatientType } from "@/lib/data-helpers";

function patientError(error: { code?: string; message?: string }): Error {
  if (error.code === "23505") return new Error("This clinic ID is already assigned. Choose a different ID or select the existing patient.");
  return new Error(error.message || "Could not save patient details. Please try again.");
}

export function usePatients() {
  const supabaseRef = useRef(createClient());
  const findPatientById = useCallback(async (patientId: string): Promise<PatientType | null> => {
    if (!patientId.trim()) return null;
    const { data, error } = await supabaseRef.current.from("patients").select("*").eq("patient_id", patientId.trim()).maybeSingle();
    if (error) throw new Error("Could not find the patient. Please try again.");
    return data ? toPatientType(data) : null;
  }, []);
  const findPatientByUuid = useCallback(async (uuid: string): Promise<PatientType | null> => {
    if (!uuid) return null;
    const { data, error } = await supabaseRef.current.from("patients").select("*").eq("id", uuid).maybeSingle();
    if (error) throw new Error("Could not load patient details. Please try again.");
    return data ? toPatientType(data) : null;
  }, []);
  const updatePatient = useCallback(async (uuid: string, updates: PatientUpdatesType): Promise<void> => {
    if (!uuid.trim()) throw new Error("Patient identity is required.");
    const { data, error } = await supabaseRef.current.from("patients").update(updates).eq("id", uuid).select("id").single();
    if (error || !data) throw patientError(error ?? {});
  }, []);
  const searchPatients = useCallback(async (filters: PatientFiltersType, page = 1, exactName?: string, descending = false, sortBy?: "id" | "name" | "registered_at"): Promise<PatientSearchResultType> => {
    const params = {
      p_query: filters.query.trim(), p_address: filters.address.trim(),
      p_age: filters.age === "" ? null : Number(filters.age), p_gender: filters.gender || null,
      p_registered: filters.registration === "all" ? null : filters.registration === "registered",
      p_page: page, p_page_size: 10, p_exact_name: exactName ?? null, p_sort_desc: descending,
    };
    const { data, error } = sortBy
      ? await supabaseRef.current.rpc("search_patients_sorted", { ...params, p_sort_key: sortBy })
      : await supabaseRef.current.rpc("search_patients", params);
    if (error || !data) throw new Error("Could not search patients. Check your connection and retry.");
    return { patients: (data.patients ?? []).map(toPatientType), total: Number(data.total) };
  }, []);
  const findPossiblePatients = useCallback(async (patient: NewPatientPayloadType): Promise<PatientSearchResultType> => {
    return searchPatients({ query: "", address: "", age: String(patient.age), gender: patient.gender, registration: "all" }, 1, patient.patient_name);
  }, [searchPatients]);
  const listPatients = useCallback(async (): Promise<PatientType[]> => {
    // Existing consumers still receive a complete listing beyond the API's default row limit.
    const result: PatientType[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabaseRef.current.from("patients").select("*").order("id").range(offset, offset + 999);
      if (error) throw new Error("Could not load patients. Please retry.");
      result.push(...(data ?? []).map(toPatientType));
      if (!data || data.length < 1000) return result;
    }
  }, []);
  const createPatient = useCallback(async (patient: PatientPayloadType): Promise<void> => {
    const { error } = await supabaseRef.current.from("patients").insert({ ...patient, is_registered: true });
    if (error) throw patientError(error);
  }, []);
  const setPatientRegistration = useCallback(async (uuid: string, registered: boolean, clinicId?: string | null, updates: PatientUpdatesType = {}): Promise<PatientType> => {
    const { data, error } = await supabaseRef.current.rpc("set_patient_registration", {
      p_patient_uuid: uuid, p_registered: registered, p_patient_id: clinicId ?? null, p_updates: updates,
    });
    if (error || !data) throw patientError(error ?? {});
    return toPatientType(data);
  }, []);
  return { listPatients, searchPatients, findPossiblePatients, findPatientById, findPatientByUuid, updatePatient, createPatient, setPatientRegistration };
}
