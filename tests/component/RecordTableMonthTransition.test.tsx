// Month reloads after backdated saves must keep the record's category visible.

import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { RecordTable } from "@/components/records/record-table";
import { useData } from "@/context/DataContext";
import { RecordCategory, type CasePatientRecordType } from "@/lib/global";

vi.mock("@/context/DataContext", () => ({ useData: vi.fn() }));
vi.mock("@/context/AuthContext", () => ({ useCanEdit: () => true }));
afterEach(cleanup);

describe("record table month transitions", () => {
  test("keeps compact search and detailed filters available", () => {
    vi.mocked(useData).mockReturnValue({
      records: [], loading: false, error: null, selectedMonth: "Nov 2026",
      setSelectedMonth: vi.fn(), refreshData: vi.fn(),
    } as unknown as ReturnType<typeof useData>);
    render(<RecordTable onAdd={vi.fn()} onEdit={vi.fn()} />);
    expect(screen.getByRole("textbox", { name: "Search records by patient name or clinic ID" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    expect(screen.getByRole("dialog", { name: "Filter records" })).toBeInTheDocument();
    expect(screen.getByLabelText("Registration")).toBeInTheDocument();
    expect(screen.getByLabelText("Gender")).toBeInTheDocument();
    expect(screen.queryByLabelText("Location / address")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Age")).not.toBeInTheDocument();
  });
  test("keeps the CASE tab and the backdated visit visible after loading another month", () => {
    const record: CasePatientRecordType = {
  patient_uuid: "patient-fixture",
      id: "backdated-case", cycle_id: "cycle-aug", patient_id: "0001/26",
      patient_name: "Backdated Patient", entry_date: "2026-08-07", month_label: "Aug 2026",
      category: RecordCategory.CASE, diagnosis: "Crown", total_cost: 75000,
      lab_name: "Central Lab", is_carried_forward: false,
    };
    const data = {
      records: [] as CasePatientRecordType[], loading: false, error: null,
      selectedMonth: "Sep 2026", setSelectedMonth: vi.fn(), refreshData: vi.fn(),
      getRecordBalance: () => 75000, getRecordTotalPaid: () => 0,
      getPaymentsForRecord: () => [],
    };
    vi.mocked(useData).mockImplementation(() => data as unknown as ReturnType<typeof useData>);
    const props = { onAdd: vi.fn(), onEdit: vi.fn() };
    const { rerender } = render(<RecordTable {...props} />);
    fireEvent.click(screen.getByRole("tab", { name: "Case Records" }));
    expect(screen.getByRole("tab", { name: "Case Records" })).toHaveAttribute("aria-selected", "true");

    data.loading = true;
    data.selectedMonth = "Aug 2026";
    rerender(<RecordTable {...props} />);
    expect(screen.queryByRole("tab", { name: "Case Records" })).not.toBeInTheDocument();

    data.loading = false;
    data.records = [record];
    rerender(<RecordTable {...props} />);
    expect(screen.getByRole("tab", { name: "Case Records" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByText("Backdated Patient").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("columnheader")).toHaveLength(11);
    expect(screen.getAllByRole("columnheader").slice(0, 3).map((header) => header.textContent)).toEqual(["#", "Date", "Patient ID"]);
    expect(screen.getAllByText("Total").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Remaining").length).toBeGreaterThan(0);
  });
});
