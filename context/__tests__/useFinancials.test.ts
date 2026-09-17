// ============================================
// Unit Tests — useFinancials Hook
// ============================================
// Tests for financial management: updateFinancials, addCustomOverhead,
// removeCustomOverhead. Verifies upsert logic and state management.

import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFinancials } from "../hooks/useFinancials";
import { MonthlyFinancials } from "@/lib/global";

// Configurable mock — tests override behavior per-test
const mockUpdateResult = { error: null as Error | null };
const mockInsertResult = { error: null as Error | null };

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockImplementation(() => Promise.resolve(mockUpdateResult)),
      }),
      insert: vi.fn().mockImplementation(() => Promise.resolve(mockInsertResult)),
    })),
  })),
}));

const INITIAL_FINANCIALS: MonthlyFinancials[] = [
  {
    id: "fin-001",
    cycle_id: "cycle-001",
    total_gp: 50000,
    total_case: 450000,
    gross_income: 500000,
    lab_fee: 100000,
    relieving_fee: 0,
    general_expenses: 50000,
    assistant_fee: 40000,
    bonus: 10000,
    utility_costs: 20000,
    building_rent: 80000,
    net_profit: 200000,
    custom_overheads: [],
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateResult.error = null;
  mockInsertResult.error = null;
});

describe("useFinancials", () => {
  describe("getFinancialsForCycle", () => {
    test("returns financials for matching cycle", () => {
      const { result } = renderHook(() => useFinancials(INITIAL_FINANCIALS));

      const fin = result.current.getFinancialsForCycle("cycle-001");
      expect(fin).toBeDefined();
      expect(fin?.total_gp).toBe(50000);
    });

    test("returns null for non-existent cycle", () => {
      const { result } = renderHook(() => useFinancials(INITIAL_FINANCIALS));

      const fin = result.current.getFinancialsForCycle("cycle-999");
      expect(fin).toBeNull();
    });
  });

  describe("updateFinancials", () => {
    test("updates existing financials in state", async () => {
      const { result } = renderHook(() => useFinancials(INITIAL_FINANCIALS));

      await act(async () => {
        await result.current.updateFinancials("cycle-001", { lab_fee: 150000 });
      });

      const updated = result.current.getFinancialsForCycle("cycle-001");
      expect(updated?.lab_fee).toBe(150000);
      expect(updated?.total_gp).toBe(50000);
    });

    test("inserts new financials when none exist for cycle", async () => {
      const { result } = renderHook(() => useFinancials([]));

      await act(async () => {
        await result.current.updateFinancials("cycle-002", { total_gp: 100000 });
      });

      const created = result.current.getFinancialsForCycle("cycle-002");
      expect(created).toBeDefined();
      expect(created?.total_gp).toBe(100000);
      expect(created?.lab_fee).toBe(0);
    });

    test("throws on Supabase update error", async () => {
      mockUpdateResult.error = new Error("Update failed");

      const { result } = renderHook(() => useFinancials(INITIAL_FINANCIALS));

      await expect(
        act(async () => {
          await result.current.updateFinancials("cycle-001", { lab_fee: 150000 });
        })
      ).rejects.toThrow("Update failed");
    });

    test("throws on Supabase insert error", async () => {
      mockInsertResult.error = new Error("Insert failed");

      const { result } = renderHook(() => useFinancials([]));

      await expect(
        act(async () => {
          await result.current.updateFinancials("cycle-002", { total_gp: 100000 });
        })
      ).rejects.toThrow("Insert failed");
    });
  });

  describe("addCustomOverhead", () => {
    test("adds overhead to existing financials", async () => {
      const { result } = renderHook(() => useFinancials(INITIAL_FINANCIALS));

      await act(async () => {
        await result.current.addCustomOverhead("cycle-001", {
          name: "Insurance",
          amount: 5000,
        });
      });

      const updated = result.current.getFinancialsForCycle("cycle-001");
      expect(updated?.custom_overheads).toHaveLength(1);
      expect(updated?.custom_overheads[0].name).toBe("Insurance");
      expect(updated?.custom_overheads[0].amount).toBe(5000);
    });

    test("creates new financials with overhead when none exist", async () => {
      const { result } = renderHook(() => useFinancials([]));

      await act(async () => {
        await result.current.addCustomOverhead("cycle-002", {
          name: "Insurance",
          amount: 5000,
        });
      });

      const created = result.current.getFinancialsForCycle("cycle-002");
      expect(created).toBeDefined();
      expect(created?.custom_overheads).toHaveLength(1);
    });

    test("appends to existing overheads", async () => {
      const withOverhead: MonthlyFinancials[] = [
        {
          ...INITIAL_FINANCIALS[0],
          custom_overheads: [{ id: "co-001", name: "Existing", amount: 3000 }],
        },
      ];
      const { result } = renderHook(() => useFinancials(withOverhead));

      await act(async () => {
        await result.current.addCustomOverhead("cycle-001", {
          name: "New Item",
          amount: 2000,
        });
      });

      const updated = result.current.getFinancialsForCycle("cycle-001");
      expect(updated?.custom_overheads).toHaveLength(2);
    });

    test("throws on Supabase error", async () => {
      mockUpdateResult.error = new Error("Overhead failed");

      const { result } = renderHook(() => useFinancials(INITIAL_FINANCIALS));

      await expect(
        act(async () => {
          await result.current.addCustomOverhead("cycle-001", {
            name: "Insurance",
            amount: 5000,
          });
        })
      ).rejects.toThrow("Overhead failed");
    });
  });

  describe("removeCustomOverhead", () => {
    test("removes overhead by id", async () => {
      const withOverhead: MonthlyFinancials[] = [
        {
          ...INITIAL_FINANCIALS[0],
          custom_overheads: [
            { id: "co-001", name: "Insurance", amount: 5000 },
            { id: "co-002", name: "Tax", amount: 3000 },
          ],
        },
      ];
      const { result } = renderHook(() => useFinancials(withOverhead));

      await act(async () => {
        await result.current.removeCustomOverhead("cycle-001", "co-001");
      });

      const updated = result.current.getFinancialsForCycle("cycle-001");
      expect(updated?.custom_overheads).toHaveLength(1);
      expect(updated?.custom_overheads[0].id).toBe("co-002");
    });

    test("does nothing when no financials exist for cycle", async () => {
      const { result } = renderHook(() => useFinancials([]));

      await act(async () => {
        await result.current.removeCustomOverhead("cycle-999", "co-001");
      });

      expect(result.current.getFinancialsForCycle("cycle-999")).toBeNull();
    });

    test("throws on Supabase error", async () => {
      mockUpdateResult.error = new Error("Remove failed");

      const withOverhead: MonthlyFinancials[] = [
        {
          ...INITIAL_FINANCIALS[0],
          custom_overheads: [{ id: "co-001", name: "Insurance", amount: 5000 }],
        },
      ];
      const { result } = renderHook(() => useFinancials(withOverhead));

      await expect(
        act(async () => {
          await result.current.removeCustomOverhead("cycle-001", "co-001");
        })
      ).rejects.toThrow("Remove failed");
    });
  });
});
