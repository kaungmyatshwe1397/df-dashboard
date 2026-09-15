// ============================================
// Component Tests — useDashboardKPIs
// ============================================
// Tests for dashboard KPI computation hook.

import { describe, test, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { DataProvider, useData } from "@/context/DataContext";
import { useDashboardKPIs } from "./useDashboardKPIs";

function wrapper({ children }: { children: ReactNode }) {
  return <DataProvider>{children}</DataProvider>;
}

describe("useDashboardKPIs", () => {
  test("computes total GP revenue from GP records", async () => {
    const { result } = renderHook(() => useDashboardKPIs(), { wrapper });

    // Wait for DataContext to finish loading data
    await waitFor(() => {
      expect(result.current.totalGpRevenue).toBeGreaterThan(0);
    });

    // Seed data has 1 GP record with total_cost=50000
    expect(result.current.totalGpRevenue).toBe(50000);
  });

  test("computes total Case revenue from payments", async () => {
    const { result } = renderHook(() => useDashboardKPIs(), { wrapper });

    await waitFor(() => {
      expect(result.current.totalCaseRevenue).toBeGreaterThan(0);
    });

    // Seed data has payments: 150000 + 100000 + 200000 = 450000
    expect(result.current.totalCaseRevenue).toBe(450000);
  });

  test("computes gross income as GP + Case revenue", async () => {
    const { result } = renderHook(() => useDashboardKPIs(), { wrapper });

    await waitFor(() => {
      expect(result.current.grossIncome).toBeGreaterThan(0);
    });

    // 50000 (GP) + 450000 (Case) = 500000
    expect(result.current.grossIncome).toBe(500000);
  });

  test("computes lab fees from case records", async () => {
    const { result } = renderHook(() => useDashboardKPIs(), { wrapper });

    await waitFor(() => {
      expect(typeof result.current.totalLabFees).toBe("number");
    });

    // Seed records in test-setup don't include lab_fee, so it's 0
    expect(result.current.totalLabFees).toBe(0);
  });

  test("computes doctor commission = (gross - lab fees) * 0.4", async () => {
    const { result } = renderHook(() => useDashboardKPIs(), { wrapper });

    await waitFor(() => {
      expect(result.current.doctorCommission).toBeGreaterThan(0);
    });

    // (500000 - 0) * 0.4 = 200000
    expect(result.current.doctorCommission).toBe(200000);
  });

  test("computes total overhead from financials", async () => {
    const { result } = renderHook(() => useDashboardKPIs(), { wrapper });

    await waitFor(() => {
      expect(result.current.totalOverhead).toBeGreaterThan(0);
    });

    // Seed financials: general_expenses=50000, assistant_fee=40000, bonus=10000,
    // utility_costs=20000, building_rent=80000 = 200000
    expect(result.current.totalOverhead).toBe(200000);
  });

  test("computes net profit/loss correctly", async () => {
    const { result } = renderHook(() => useDashboardKPIs(), { wrapper });

    await waitFor(() => {
      expect(result.current.netProfitLoss).not.toBe(0);
    });

    // gross(500000) - lab(0) - commission(200000) - overhead(200000) = 100000
    expect(result.current.netProfitLoss).toBe(100000);
  });

  test("returns empty customOverheads when seed data has none", async () => {
    const { result } = renderHook(() => useDashboardKPIs(), { wrapper });

    await waitFor(() => {
      expect(typeof result.current.totalOverhead).toBe("number");
    });

    expect(result.current.customOverheads).toEqual([]);
  });
});
