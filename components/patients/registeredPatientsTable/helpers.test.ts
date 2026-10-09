// ============================================
// Unit Tests — Registered Patients helpers
// ============================================
// Tests for the client-side registry search filter and the
// d.M.yy registration-date formatter.

import { describe, test, expect } from "vitest";
import { filterPatients, formatRegisteredDate } from "./helpers";
import { PatientType, Gender } from "@/lib/global";

function makePatient(id: string, name: string): PatientType {
  return {
    id: `uuid-${id}`,
    patient_id: id,
    patient_name: name,
    age: 30,
    gender: Gender.MALE,
    current_medications: [],
    past_medical_history: [],
  };
}

const patients: PatientType[] = [
  makePatient("0001/26", "MgMg"),
  makePatient("0002/26", "Aung Kyaw"),
  makePatient("0042/25", "mya mya"),
];

describe("filterPatients", () => {
  test("empty query returns everything", () => {
    expect(filterPatients(patients, "")).toHaveLength(3);
    expect(filterPatients(patients, "   ")).toHaveLength(3);
  });

  test("matches by patient ID", () => {
    const result = filterPatients(patients, "0042/25");
    expect(result).toHaveLength(1);
    expect(result[0].patient_name).toBe("mya mya");
  });

  test("does not match by patient name", () => {
    expect(filterPatients(patients, "aung")).toHaveLength(0);
    expect(filterPatients(patients, "MYA MYA")).toHaveLength(0);
  });

  test("no match returns an empty list", () => {
    expect(filterPatients(patients, "zzz")).toHaveLength(0);
  });
});

describe("formatRegisteredDate", () => {
  test("formats an ISO timestamp as d.M.yy", () => {
    expect(formatRegisteredDate("2026-09-26T12:00:00.000Z")).toBe("26.9.26");
    expect(formatRegisteredDate("2026-01-05T12:00:00.000Z")).toBe("5.1.26");
  });

  test("missing or invalid input renders an em dash", () => {
    expect(formatRegisteredDate(undefined)).toBe("—");
    expect(formatRegisteredDate("not-a-date")).toBe("—");
  });
});
