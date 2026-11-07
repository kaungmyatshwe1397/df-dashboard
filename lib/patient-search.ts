// Shared matching rules keep monthly visit filters consistent with global patient selection.
import type { PatientFiltersType, PatientType, PatientRecord } from "./global";

export const EMPTY_PATIENT_FILTERS: PatientFiltersType = {
  query: "", address: "", age: "", gender: "", registration: "all",
};

export function matchesPatientFilters(patient: PatientType, filters: PatientFiltersType): boolean {
  const query = filters.query.trim().toLocaleLowerCase();
  return (!query || patient.patient_name.toLocaleLowerCase().includes(query)
    || (patient.patient_id ?? "").toLocaleLowerCase().includes(query))
    && (!filters.address.trim() || (patient.address ?? "").toLocaleLowerCase().includes(filters.address.trim().toLocaleLowerCase()))
    && (!filters.age || patient.age === Number(filters.age))
    && (!filters.gender || patient.gender === filters.gender)
    && (filters.registration === "all" || patient.is_registered === (filters.registration === "registered"));
}

export function hasPatientFilters(filters: PatientFiltersType): boolean {
  return !!(filters.query.trim() || filters.address.trim() || filters.age || filters.gender || filters.registration !== "all");
}

export function matchesRecordFilters(record: PatientRecord, filters: PatientFiltersType): boolean {
  if (record.patient) return matchesPatientFilters(record.patient, filters);
  const query = filters.query.trim().toLocaleLowerCase();
  return (!query || record.patient_name.toLocaleLowerCase().includes(query)
    || (record.patient_id ?? "").toLocaleLowerCase().includes(query))
    && (!filters.address.trim() || (record.address ?? "").toLocaleLowerCase().includes(filters.address.trim().toLocaleLowerCase()))
    && (!filters.age || record.age === Number(filters.age))
    && (!filters.gender || record.gender === filters.gender)
    && filters.registration === "all";
}
