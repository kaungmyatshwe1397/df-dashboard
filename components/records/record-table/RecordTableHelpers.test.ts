// ============================================
// Unit Tests — RecordTableHelpers
// ============================================
// Tests for formatCurrency and formatDate pure functions.

import { describe, test, expect } from "vitest";
import { formatCurrency, formatDate } from "./RecordTableHelpers";

describe("formatCurrency", () => {
  test("formats integer with comma separators", () => {
    expect(formatCurrency(50000)).toBe("50,000");
  });

  test("handles zero", () => {
    expect(formatCurrency(0)).toBe("0");
  });

  test("formats large numbers", () => {
    expect(formatCurrency(1000000)).toBe("1,000,000");
  });

  test("formats numbers without decimals", () => {
    expect(formatCurrency(1234567.89)).toBe("1,234,568");
  });
});

describe("formatDate", () => {
  test("formats ISO date string to readable format", () => {
    const result = formatDate("2026-09-01");
    expect(result).toBe("Sep 1, 2026");
  });

  test("handles different months", () => {
    expect(formatDate("2026-01-15")).toBe("Jan 15, 2026");
    expect(formatDate("2026-12-25")).toBe("Dec 25, 2026");
  });
});
