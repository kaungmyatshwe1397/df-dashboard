// Keep unpaid case balances and their payments linked during carry-forward.

import { act, renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { describe, expect, test } from "vitest";
import { DataProvider, useData } from "@/context/DataContext";

function wrapper({ children }: { children: ReactNode }) {
  return <DataProvider>{children}</DataProvider>;
}

describe("carryForward", () => {
  test("moves only unsettled cases and preserves their payments and balance", async () => {
    const { result } = renderHook(() => useData(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const gpBefore = result.current.records.find((record) => record.id === "rec-001");
    const settledCaseBefore = result.current.records.find((record) => record.id === "rec-002");
    const unsettledCaseBefore = result.current.records.find((record) => record.id === "rec-003");
    expect(gpBefore).toBeDefined();
    expect(settledCaseBefore).toBeDefined();
    expect(unsettledCaseBefore).toBeDefined();

    const paymentsBefore = result.current.getPaymentsForRecord("rec-003");
    const balanceBefore = result.current.getRecordBalance(unsettledCaseBefore!);

    let carriedCount = 0;
    await act(async () => {
      ({ carriedCount } = await result.current.carryForward());
    });

    const gpAfter = result.current.records.find((record) => record.id === "rec-001");
    const settledCaseAfter = result.current.records.find((record) => record.id === "rec-002");
    const unsettledCaseAfter = result.current.records.find((record) => record.id === "rec-003");

    expect(carriedCount).toBe(1);
    expect(unsettledCaseAfter).toMatchObject({
      cycle_id: expect.not.stringMatching("cycle-001"),
      month_label: "Oct 2026",
      is_carried_forward: true,
      remaining: balanceBefore,
    });
    expect(result.current.getPaymentsForRecord("rec-003")).toEqual(paymentsBefore);
    expect(result.current.getRecordBalance(unsettledCaseAfter!)).toBe(balanceBefore);
    expect(settledCaseAfter).toMatchObject({
      cycle_id: "cycle-001",
      is_carried_forward: false,
    });
    expect(gpAfter).toMatchObject({ cycle_id: "cycle-001" });

    await act(async () => {
      result.current.setSelectedMonth("Oct 2026");
    });
    await waitFor(() => expect(result.current.cycle?.month_year).toBe("2026-10"));
    expect(unsettledCaseAfter?.cycle_id).toBe(result.current.cycle?.id);
    expect(result.current.records.map((record) => record.id)).toContain("rec-003");
  });
});
