// Direct Case entry must save without registration or lab work while protecting initial receipts on retry.
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NewPatientRecord } from "@/components/records/newPatientRecord";
import { RecordCategory } from "@/lib/global";

const mocks = vi.hoisted(() => ({ addRecord: vi.fn(), push: vi.fn(), find: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/context/AuthContext", () => ({ useCanEdit: () => true }));
vi.mock("@/context/DataContext", () => ({ useData: () => ({ addRecord: mocks.addRecord }) }));
vi.mock("@/context/hooks/usePatients", () => ({ usePatients: mocks.find }));
vi.mock("@/components/records/patient-record-update-form/CaseTypeSelector", () => ({
  CaseTypeSelector: ({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled?: boolean }) =>
    <input id="caseType" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />,
}));
vi.mock("@/components/records/patient-record-update-form/LabSelector", () => ({
  LabSelector: ({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled?: boolean }) =>
    <input id="labName" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />,
}));

beforeEach(() => { vi.clearAllMocks(); mocks.addRecord.mockResolvedValue(undefined); });
afterEach(cleanup);

function openCase() { render(<NewPatientRecord listPath="/assistant" category={RecordCategory.CASE} />); }
function fillCase() {
  fireEvent.change(screen.getByLabelText(/Patient Name/), { target: { value: "Case Person" } });
  fireEvent.change(screen.getByLabelText(/^Age/), { target: { value: "30" } });
  fireEvent.change(screen.getByLabelText(/Telephone/), { target: { value: "09 123456" } });
  fireEvent.change(screen.getByLabelText(/Case Type/), { target: { value: "Crown" } });
  fireEvent.change(screen.getByLabelText(/Total Cost/), { target: { value: "100000" } });
}

test("opens Case fields directly with collapsed optional lab details and zero payment", () => {
  openCase();
  expect(screen.getByLabelText(/Patient Name/)).toBeEnabled();
  expect(screen.getByLabelText(/Case Type/)).toBeEnabled();
  expect(screen.getByLabelText(/Amount paid today/)).toHaveValue("0");
  expect(screen.queryByRole("button", { name: "Patient ID" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Find existing patient" })).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/Lab Name/)).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/Drug Allergy/)).not.toBeInTheDocument();
  expect(mocks.find).not.toHaveBeenCalled();
});

test("saves without a lab, registry choice, or initial receipt and returns to Case", async () => {
  openCase(); fillCase();
  expect(screen.getByLabelText(/Remaining balance/)).toHaveValue("100,000");
  fireEvent.click(screen.getByRole("button", { name: "Save & back" }));
  await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/assistant?tab=case"));
  expect(mocks.addRecord).toHaveBeenCalledWith(expect.objectContaining({ category: RecordCategory.CASE, diagnosis: "Crown", case_type: "Crown", total_cost: 100000, lab_name: undefined }),
    { record_patient: expect.objectContaining({ patient_name: "Case Person", age: 30, telephone: "09 123456" }) }, 0, expect.any(String));
  expect(mocks.find).not.toHaveBeenCalled();
});

test("saves a deposit, selected teeth, and optional lab milestones", async () => {
  openCase(); fillCase();
  fireEvent.click(screen.getByRole("checkbox", { name: "11" }));
  fireEvent.change(screen.getByLabelText(/Amount paid today/), { target: { value: "25000" } });
  expect(screen.getByLabelText(/Remaining balance/)).toHaveValue("75,000");
  fireEvent.click(screen.getByRole("button", { name: "Lab details (optional)" }));
  fireEvent.change(await screen.findByLabelText(/Lab Name/), { target: { value: "Dental Lab" } });
  fireEvent.change(screen.getByLabelText(/Lab Send Date/), { target: { value: "2026-09-16" } });
  fireEvent.change(screen.getByLabelText(/Delivery Date/), { target: { value: "2026-09-25" } });
  fireEvent.click(screen.getByRole("button", { name: "Save & back" }));
  await waitFor(() => expect(mocks.addRecord).toHaveBeenCalled());
  expect(mocks.addRecord.mock.calls[0][0]).toMatchObject({ diagnosis: "Crown at 11", teeth: "11", lab_name: "Dental Lab", lab_send_date: "2026-09-16", delivery_date: "2026-09-25" });
  expect(mocks.addRecord.mock.calls[0][2]).toBe(25000);
});

test("rejects overpayment and missing case details before saving", () => {
  openCase();
  fireEvent.click(screen.getByRole("button", { name: "Save & back" }));
  expect(screen.getByText("Patient name is required.")).toBeInTheDocument();
  expect(screen.getByText("Case type is required.")).toBeInTheDocument();
  fillCase();
  fireEvent.change(screen.getByLabelText(/Amount paid today/), { target: { value: "100001" } });
  fireEvent.click(screen.getByRole("button", { name: "Save & back" }));
  expect(screen.getByText("Paid amount cannot exceed total cost.")).toBeInTheDocument();
  expect(mocks.addRecord).not.toHaveBeenCalled();
});

test("resets patient, treatment, payment, and lab details while keeping the date", async () => {
  openCase(); fillCase();
  const date = (screen.getByLabelText(/Record Date/) as HTMLInputElement).value;
  fireEvent.click(screen.getByRole("button", { name: "Lab details (optional)" }));
  fireEvent.change(await screen.findByLabelText(/Lab Name/), { target: { value: "Previous Lab" } });
  fireEvent.change(screen.getByLabelText(/Amount paid today/), { target: { value: "25000" } });
  fireEvent.click(screen.getByRole("button", { name: "Save & add another" }));
  await waitFor(() => expect(screen.getByLabelText(/Patient Name/)).toHaveValue(""));
  expect(screen.getByLabelText(/Telephone/)).toHaveValue("");
  expect(screen.getByLabelText(/Case Type/)).toHaveValue("");
  expect(screen.getByLabelText(/Total Cost/)).toHaveValue("");
  expect(screen.getByLabelText(/Amount paid today/)).toHaveValue("0");
  expect(screen.getByLabelText(/Record Date/)).toHaveValue(date);
  expect(screen.queryByLabelText(/Lab Name/)).not.toBeInTheDocument();
  fillCase();
  fireEvent.click(screen.getByRole("button", { name: "Save & back" }));
  await waitFor(() => expect(mocks.addRecord).toHaveBeenCalledTimes(2));
  expect(mocks.addRecord.mock.calls[1][3]).not.toBe(mocks.addRecord.mock.calls[0][3]);
});

test("locks an uncertain save and retries exactly the same Case and deposit", async () => {
  mocks.addRecord.mockRejectedValueOnce(new Error("Response lost"));
  openCase(); fillCase();
  fireEvent.change(screen.getByLabelText(/Amount paid today/), { target: { value: "25000" } });
  fireEvent.click(screen.getByRole("button", { name: "Save & back" }));
  await screen.findByText("Response lost");
  expect(screen.getByLabelText(/Patient Name/)).toBeDisabled();
  expect(screen.getByLabelText(/Amount paid today/)).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Retry save" }));
  await waitFor(() => expect(mocks.addRecord).toHaveBeenCalledTimes(2));
  expect(mocks.addRecord.mock.calls[1]).toEqual(mocks.addRecord.mock.calls[0]);
});
