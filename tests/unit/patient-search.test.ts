// Literal text matching and combined filters distinguish patients without depending on clinic IDs.
import { describe, expect, test } from "vitest";
import { EMPTY_PATIENT_FILTERS, matchesPatientFilters } from "@/lib/patient-search";
import { Gender, type PatientType } from "@/lib/global";

const patient: PatientType = { id: "person-1", patient_id: null, is_registered: false,
  patient_name: "Ma Aye", age: 40, gender: Gender.FEMALE, address: "North Village",
  current_medications: [], past_medical_history: [] };

describe("patient filters", () => {
  test("finds an unregistered profile without an ID using combined demographics", () => {
    expect(matchesPatientFilters(patient, { query: " AYE ", address: "north", age: "40", gender: "FEMALE", registration: "unregistered" })).toBe(true);
  });
  test("all fields combine with AND and age is exact", () => {
    expect(matchesPatientFilters(patient, { ...EMPTY_PATIENT_FILTERS, age: "4" })).toBe(false);
    expect(matchesPatientFilters(patient, { ...EMPTY_PATIENT_FILTERS, query: "Aye", registration: "registered" })).toBe(false);
    expect(matchesPatientFilters(patient, { ...EMPTY_PATIENT_FILTERS, gender: "MALE" })).toBe(false);
  });
  test("supports retained clinic IDs independently of current registration", () => {
    expect(matchesPatientFilters({ ...patient, patient_id: "0123/25" }, { ...EMPTY_PATIENT_FILTERS, query: "123/25" })).toBe(true);
  });
  test("treats search punctuation literally and optional addresses safely", () => {
    expect(matchesPatientFilters(patient, { ...EMPTY_PATIENT_FILTERS, query: "%" })).toBe(false);
    expect(matchesPatientFilters({ ...patient, address: undefined }, { ...EMPTY_PATIENT_FILTERS, address: "north" })).toBe(false);
  });
});
