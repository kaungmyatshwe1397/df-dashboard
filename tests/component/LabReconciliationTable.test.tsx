// Component tests for the grouped lab reconciliation rows.

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LabReconciliationTable } from "@/components/reconciliation/LabReconciliationTable";

const mock = vi.hoisted(() => ({
  canEdit: true,
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
  useCanEdit: () => mock.canEdit,
}));

beforeEach(() => {
  mock.canEdit = true;
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
  test("identifies the patient beside a failed lab fee save", async () => {
    mock.context.updateRecord.mockRejectedValue(new Error("Save failed. Try again."));
    render(<LabReconciliationTable />);
    const input = screen.getByRole("textbox", { name: "Lab fee for MgMg" });
    fireEvent.change(input, { target: { value: "25000" } });
    fireEvent.blur(input);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Lab fee for MgMg: Save failed. Try again."));
    expect(input).toHaveValue("25000");
  });

  test("read-only roles cannot change a lab fee", () => {
    mock.canEdit = false;
    render(<LabReconciliationTable />);
    expect(screen.getByRole("textbox", { name: "Lab fee for MgMg" })).toBeDisabled();
  });

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
