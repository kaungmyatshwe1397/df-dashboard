// ============================================
// Unit Tests — Data Helpers
// ============================================
// Tests for pure functions extracted from DataContext.

import { describe, test, expect } from "vitest";
import {
  getMonthLabel,
  getNextMonthLabel,
  toPatientRecord,
  toCustomOverhead,
} from "./data-helpers";
import { RecordCategory } from "./global";
import type { CasePatientRecordType } from "./global";

describe("getMonthLabel", () => {
  test("converts YYYY-MM to 'Mon YYYY' format", () => {
    expect(getMonthLabel("2026-09")).toBe("Sep 2026");
  });

  test("handles January correctly", () => {
    expect(getMonthLabel("2027-01")).toBe("Jan 2027");
  });

  test("handles December correctly", () => {
    expect(getMonthLabel("2026-12")).toBe("Dec 2026");
  });
});

describe("getNextMonthLabel", () => {
  test("returns next month in YYYY-MM format", () => {
    expect(getNextMonthLabel("2026-09")).toBe("2026-10");
  });

  test("wraps from December to January of next year", () => {
    expect(getNextMonthLabel("2026-12")).toBe("2027-01");
  });

  test("handles single-digit month padding", () => {
    expect(getNextMonthLabel("2026-01")).toBe("2026-02");
  });
});

describe("toPatientRecord", () => {
  test("maps GP row to typed GP record", () => {
    const row = {
      id: "rec-001",
      cycle_id: "cycle-001",
      patient_id: "0001/26",
      entry_date: "2026-09-01",
      patient_name: "John Doe",
      address: "123 Main St",
      category: "GP",
      diagnosis: "Common cold",
      total_cost: 50000,
      month_label: "Sep 2026",
    };

    const record = toPatientRecord(row);

    expect(record.id).toBe("rec-001");
    expect(record.category).toBe(RecordCategory.GP);
    expect(record.patient_name).toBe("John Doe");
    expect(record.total_cost).toBe(50000);
    expect("lab_name" in record).toBe(false);
  });

  test("maps CASE row to typed Case record with all fields", () => {
    const row = {
      id: "rec-002",
      cycle_id: "cycle-001",
      patient_id: "0002/26",
      entry_date: "2026-09-02",
      patient_name: "Jane Smith",
      category: "CASE",
      diagnosis: "Fracture",
      total_cost: 250000,
      month_label: "Sep 2026",
      lab_name: "Central Lab",
      paid: 100000,
      remaining: 150000,
      is_carried_forward: false,
      case_type: "RPD",
      teeth: "41,42",
    };

    const record = toPatientRecord(row) as CasePatientRecordType;

    expect(record.category).toBe(RecordCategory.CASE);
    expect(record.lab_name).toBe("Central Lab");
    expect(record.paid).toBe(100000);
    expect(record.case_type).toBe("RPD");
    expect(record.teeth).toBe("41,42");
  });

  test("handles missing optional fields gracefully", () => {
    const row = {
      id: "rec-003",
      cycle_id: "cycle-001",
      patient_id: "0003/26",
      entry_date: "2026-09-03",
      patient_name: "Bob",
      category: "GP",
      diagnosis: "Checkup",
      total_cost: 10000,
      month_label: "Sep 2026",
    };

    const record = toPatientRecord(row);

    expect(record.address).toBeUndefined();
  });
});

describe("toCustomOverhead", () => {
  test("returns empty array for null/undefined input", () => {
    expect(toCustomOverhead(null)).toEqual([]);
    expect(toCustomOverhead(undefined)).toEqual([]);
  });

  test("returns array as-is when already an array", () => {
    const items = [{ id: "1", name: "Insurance", amount: 5000 }];
    expect(toCustomOverhead(items)).toEqual(items);
  });

  test("parses valid JSON string into array", () => {
    const json = JSON.stringify([{ id: "1", name: "Supplies", amount: 2000 }]);
    const result = toCustomOverhead(json);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Supplies");
  });

  test("returns empty array for invalid JSON string", () => {
    expect(toCustomOverhead("not-json")).toEqual([]);
  });

  test("returns empty array for JSON string that is not an array", () => {
    expect(toCustomOverhead('{"name":"test"}')).toEqual([]);
  });

  test("returns empty array for non-object, non-array, non-string types", () => {
    expect(toCustomOverhead(42)).toEqual([]);
    expect(toCustomOverhead(true)).toEqual([]);
  });
});
