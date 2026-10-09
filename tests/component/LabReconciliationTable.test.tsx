// Component tests for the grouped lab reconciliation rows.

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { LabReconciliationTable } from "@/components/reconciliation/LabReconciliationTable";

const mock = vi.hoisted(() => ({
  context: {
    records: [] as unknown[],
    loading: false,
    error: null as string | null,
    refreshData: vi.fn(),
    updateRecord: vi.fn(),
  },
}));

vi.mock("@/context/DataContext", () => ({
  useData: () => mock.context,
}));

vi.mock("@/context/AuthContext", () => ({
  useCanEdit: () => true,
}));

beforeEach(() => {
  mock.context.records = [
    {
      id: "case-1",
      cycle_id: "cycle-1",
      patient_id: "0001/26",
      entry_date: "2026-09-26",
      patient_name: "MgMg",
      category: "CASE",
      diagnosis: "RPD at 41,42,43,44",
      total_cost: 250000,
      month_label: "Sep 2026",
      lab_name: "Central Lab",
      lab_fee: 15000,
      is_carried_forward: false,
    },
  ];
  mock.context.refreshData.mockReset();
  mock.context.updateRecord.mockReset().mockResolvedValue(undefined);
});

afterEach(cleanup);

describe("LabReconciliationTable", () => {
  test("shows patient, ID, case, date, and fee as distinct labeled columns", () => {
    render(<LabReconciliationTable />);

    expect(screen.getAllByText("Patient").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Patient ID").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Case").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Date").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Lab fee").length).toBeGreaterThan(0);
    expect(screen.getByText("MgMg")).toBeInTheDocument();
    expect(screen.getByText("0001/26")).toBeInTheDocument();
    expect(screen.getByText("RPD at 41,42,43,44")).toBeInTheDocument();
  });
});
