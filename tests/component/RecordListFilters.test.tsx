// Lab selection must share the existing filter sheet and preserve record actions in compact rows.
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RecordTable } from "@/components/records/record-table";
import { PaymentRow } from "@/components/records/record-table/PaymentRow";
import { useData } from "@/context/DataContext";
import { RecordCategory, type CasePatientRecordType } from "@/lib/global";

vi.mock("@/context/DataContext", () => ({ useData: vi.fn() }));
vi.mock("@/context/AuthContext", () => ({ useCanEdit: () => true }));
afterEach(cleanup);

const base: CasePatientRecordType = { id: "case-a", cycle_id: "cycle", patient_uuid: null, patient_id: null,
  entry_date: "2026-09-01", month_label: "Sep 2026", patient_name: "Alpha Patient", category: RecordCategory.CASE,
  diagnosis: "Crown", total_cost: 10000, lab_name: "Alpha Lab", is_carried_forward: false };
const records = [base, { ...base, id: "case-b", patient_name: "Beta Patient", lab_name: "Beta Lab" },
  { ...base, id: "case-c", patient_name: "No Lab Patient", lab_name: "" }];

function openCaseList() {
  vi.mocked(useData).mockReturnValue({ records, loading: false, error: null, selectedMonth: "Sep 2026",
    setSelectedMonth: vi.fn(), refreshData: vi.fn(), getRecordBalance: () => 10000,
    getRecordTotalPaid: () => 0, getPaymentsForRecord: () => [],
    labs: [{ id: "a", lab_name: "Alpha Lab" }, { id: "b", lab_name: "Beta Lab" }, { id: "empty", lab_name: "Empty Lab" }],
  } as unknown as ReturnType<typeof useData>);
  render(<RecordTable onAdd={vi.fn()} onEdit={vi.fn()} />);
  fireEvent.click(screen.getByRole("tab", { name: "Case Records" }));
}

async function chooseLab(name: string) {
  fireEvent.click(screen.getByRole("button", { name: /^Filters/ }));
  fireEvent.click(screen.getByRole("combobox", { name: "Filter cases by lab" }));
  const option = await screen.findByRole("option", { name });
  fireEvent.pointerDown(option, { pointerType: "mouse", button: 0 });
  fireEvent.click(option);
  await waitFor(() => expect(screen.getByRole("combobox", { name: "Filter cases by lab" })).toHaveTextContent(name));
  fireEvent.click(within(screen.getByRole("dialog", { name: "Filter records" })).getByRole("button", { name: "Close" }));
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "Filter records" })).not.toBeInTheDocument());
}

test("keeps lab selection inside Filters, combines it with search, and clears it with the other filters", async () => {
  openCaseList();
  expect(screen.queryByRole("combobox", { name: "Filter cases by lab" })).not.toBeInTheDocument();
  await chooseLab("Alpha Lab");
  expect(screen.getAllByText("Alpha Patient").length).toBeGreaterThan(0);
  expect(screen.queryAllByText("Beta Patient")).toHaveLength(0);
  expect(within(screen.getByRole("button", { name: /^Filters/ })).getByText("1")).toBeInTheDocument();
  fireEvent.change(screen.getByRole("textbox", { name: "Search records by patient name or clinic ID" }), { target: { value: "Beta" } });
  expect(screen.getByText("No case records match these filters. Try fewer filters.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /^Filters/ }));
  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  fireEvent.click(within(screen.getByRole("dialog", { name: "Filter records" })).getByRole("button", { name: "Close" }));
  await waitFor(() => expect(screen.getAllByText("Beta Patient").length).toBeGreaterThan(0));
  expect(screen.getAllByText("Alpha Patient").length).toBeGreaterThan(0);
  expect(screen.getByRole("button", { name: "Filters" })).toBeInTheDocument();
});

test("supports unassigned labs and a configured lab with no matching cases", async () => {
  openCaseList();
  await chooseLab("Not assigned");
  expect(screen.getAllByText("No Lab Patient").length).toBeGreaterThan(0);
  expect(screen.queryAllByText("Alpha Patient")).toHaveLength(0);
  await chooseLab("Empty Lab");
  expect(screen.getByText("No case records match these filters. Try fewer filters.")).toBeInTheDocument();
});

test("the compact Actions menu retains edit, payment, and history callbacks", async () => {
  const onEdit = vi.fn(), onPay = vi.fn(), onToggleExpand = vi.fn();
  render(<table><tbody><PaymentRow record={base} rowNumber={1} totalPaid={0} remaining={10000}
    isSettled={false} isExpanded={false} onEdit={onEdit} onPay={onPay} onToggleExpand={onToggleExpand} /></tbody></table>);
  fireEvent.click(screen.getByRole("button", { name: "Actions for Alpha Patient" }));
  fireEvent.click(await screen.findByRole("menuitem", { name: "Edit visit" }));
  expect(onEdit).toHaveBeenCalledWith(base);
  fireEvent.click(screen.getByRole("button", { name: "Actions for Alpha Patient" }));
  fireEvent.click(await screen.findByRole("menuitem", { name: "Record payment" }));
  expect(onPay).toHaveBeenCalledWith(base);
  fireEvent.click(screen.getByRole("button", { name: "Actions for Alpha Patient" }));
  fireEvent.click(await screen.findByRole("menuitem", { name: "View payments" }));
  expect(onToggleExpand).toHaveBeenCalledWith(base.id);
});
