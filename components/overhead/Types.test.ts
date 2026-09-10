// ============================================
// Unit Tests — OverheadForm Types
// ============================================
// Tests for financialsToFields and customOverheadsToForm helpers.

import { describe, test, expect } from "vitest";
import { financialsToFields, customOverheadsToForm } from "./Types";

describe("financialsToFields", () => {
  test("converts positive values to strings", () => {
    const result = financialsToFields({
      general_expenses: 50000,
      assistant_fee: 40000,
      bonus: 10000,
      building_rent: 80000,
      utility_costs: 20000,
    });

    expect(result.general_expenses).toBe("50000");
    expect(result.assistant_fee).toBe("40000");
    expect(result.bonus).toBe("10000");
    expect(result.building_rent).toBe("80000");
    expect(result.utility_costs).toBe("20000");
  });

  test("converts zero values to empty strings", () => {
    const result = financialsToFields({
      general_expenses: 0,
      assistant_fee: 0,
      bonus: 0,
      building_rent: 0,
      utility_costs: 0,
    });

    expect(result.general_expenses).toBe("");
    expect(result.assistant_fee).toBe("");
    expect(result.bonus).toBe("");
    expect(result.building_rent).toBe("");
    expect(result.utility_costs).toBe("");
  });

  test("handles mixed zero and non-zero values", () => {
    const result = financialsToFields({
      general_expenses: 50000,
      assistant_fee: 0,
      bonus: 10000,
      building_rent: 0,
      utility_costs: 20000,
    });

    expect(result.general_expenses).toBe("50000");
    expect(result.assistant_fee).toBe("");
    expect(result.bonus).toBe("10000");
    expect(result.building_rent).toBe("");
    expect(result.utility_costs).toBe("20000");
  });
});

describe("customOverheadsToForm", () => {
  test("converts items with positive amounts to strings", () => {
    const items = [
      { id: "1", name: "Insurance", amount: 5000 },
      { id: "2", name: "Supplies", amount: 2000 },
    ];

    const result = customOverheadsToForm(items);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: "Insurance", amount: "5000" });
    expect(result[1]).toEqual({ name: "Supplies", amount: "2000" });
  });

  test("converts zero amounts to empty strings", () => {
    const items = [{ id: "1", name: "Insurance", amount: 0 }];

    const result = customOverheadsToForm(items);

    expect(result[0].amount).toBe("");
  });

  test("returns empty array for empty input", () => {
    expect(customOverheadsToForm([])).toEqual([]);
  });
});
