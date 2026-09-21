// ============================================
// Unit Tests — Mock Data Helpers
// ============================================
// These are pure functions with no React, no DOM.
// They just take input → return output.
// This is the easiest type of test to write.

import { describe, test, expect } from "vitest";
import {
  getActiveCycle,
  getRecordsByCycle,
  getPaymentsByRecord,
} from "../mock-data";
import { CycleStatus, RecordCategory } from "../global";

// ------------------------------------------
// getActiveCycle()
// ------------------------------------------
describe("getActiveCycle", () => {
  test("returns the cycle with OPEN status", () => {
    const cycle = getActiveCycle();
    expect(cycle).toBeDefined();
    expect(cycle?.status).toBe(CycleStatus.OPEN);
  });

  test("returns the September 2026 cycle", () => {
    const cycle = getActiveCycle();
    expect(cycle?.month_year).toBe("2026-09");
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
