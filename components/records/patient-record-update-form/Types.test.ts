// ============================================
// Unit Tests — PatientRecordUpdateForm Types
// ============================================
// Tests for getInitialForm helper function.

import { describe, test, expect } from "vitest";
import { getInitialForm } from "./Types";
import { RecordCategory, GPPatientRecordType, CasePatientRecordType } from "@/lib/global";

const gpRecord: GPPatientRecordType = {
  id: "rec-001",
  cycle_id: "cycle-001",
  patient_id: "0001/26",
  entry_date: "2026-09-01",
  patient_name: "John Doe",
  address: "123 Main St",
  category: RecordCategory.GP,
  diagnosis: "Common cold",
  total_cost: 50000,
  month_label: "Sep 2026",
};

const caseRecord: CasePatientRecordType = {
  id: "rec-002",
  cycle_id: "cycle-001",
  patient_id: "0002/26",
  entry_date: "2026-09-02",
  patient_name: "Jane Smith",
  category: RecordCategory.CASE,
  diagnosis: "RPD at 41,42",
  total_cost: 250000,
  month_label: "Sep 2026",
  lab_name: "Central Lab",
  case_type: "RPD",
  teeth: "41,42",
  paid: 100000,
  remaining: 150000,
  is_carried_forward: false,
};

describe("getInitialForm", () => {
  test("returns correct fields for GP record", () => {
    const form = getInitialForm(gpRecord);

    expect(form.patientId).toBe("0001/26");
    expect(form.patientName).toBe("John Doe");
    expect(form.address).toBe("123 Main St");
    expect(form.diagnosis).toBe("Common cold");
    expect(form.totalCost).toBe("50000");
    expect(form.caseType).toBe("");
    expect(form.teeth).toBe("");
    expect(form.labName).toBe("");
  });

  test("returns correct fields for Case record including case-specific data", () => {
    const form = getInitialForm(caseRecord);

    expect(form.patientId).toBe("0002/26");
    expect(form.patientName).toBe("Jane Smith");
    expect(form.diagnosis).toBe("RPD at 41,42");
    expect(form.caseType).toBe("RPD");
    expect(form.teeth).toBe("41,42");
    expect(form.labName).toBe("Central Lab");
    expect(form.paid).toBe("100000");
    expect(form.totalCost).toBe("250000");
  });

  test("converts undefined optional fields to empty strings", () => {
    const recordWithoutAddress = { ...gpRecord, address: undefined };
    const form = getInitialForm(recordWithoutAddress);

    expect(form.address).toBe("");
  });
});
