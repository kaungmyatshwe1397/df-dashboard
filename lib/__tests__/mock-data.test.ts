// ============================================
// Unit Tests — Mock Data Helpers
// ============================================
// These are pure functions with no React, no DOM.
// They just take input → return output.
// This is the easiest type of test to write.

import { describe, test, expect } from "vitest";
import {
  getCycleByMonth,
  getRecordsByCycle,
  getPaymentsByRecord,
} from "../mock-data";
import { RecordCategory } from "../global";

// ------------------------------------------
// getCycleByMonth()
// ------------------------------------------
describe("getCycleByMonth", () => {
  test("returns the cycle for a known month", () => {
    const cycle = getCycleByMonth("2026-09");
    expect(cycle).toBeDefined();
    expect(cycle?.month_year).toBe("2026-09");
  });

  test("returns undefined for an unknown month", () => {
    expect(getCycleByMonth("1999-01")).toBeUndefined();
  });
});

// ------------------------------------------
// getRecordsByCycle()
// ------------------------------------------
describe("getRecordsByCycle", () => {
  test("returns only records for the given cycle", () => {
    const records = getRecordsByCycle("cycle-001");
    expect(records.length).toBeGreaterThan(0);
    records.forEach((r) => {
      expect(r.cycle_id).toBe("cycle-001");
    });
  });

  // Edge case: no records for unknown cycle
  test("returns empty array for unknown cycle", () => {
    const records = getRecordsByCycle("cycle-unknown");
    expect(records).toEqual([]);
  });

  // Verify mix of GP and CASE records exist
  test("contains both GP and CASE records", () => {
    const records = getRecordsByCycle("cycle-001");
    const hasGP = records.some((r) => r.category === RecordCategory.GP);
    const hasCase = records.some((r) => r.category === RecordCategory.CASE);
    expect(hasGP).toBe(true);
    expect(hasCase).toBe(true);
  });
});

// ------------------------------------------
// getPaymentsByRecord()
// ------------------------------------------
describe("getPaymentsByRecord", () => {
  test("returns payments for a specific record", () => {
    const payments = getPaymentsByRecord("rec-002");
    expect(payments.length).toBeGreaterThan(0);
    payments.forEach((p) => {
      expect(p.record_id).toBe("rec-002");
    });
  });

  test("returns empty array for record with no payments", () => {
    // rec-001 is a GP record with no payments
    const payments = getPaymentsByRecord("rec-001");
    expect(payments).toEqual([]);
  });
});
