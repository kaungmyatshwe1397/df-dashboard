// Direct GP entry must stay independent of registration while preserving safe visit retries.
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NewPatientRecord } from "@/components/records/newPatientRecord";
import { Gender, RecordCategory } from "@/lib/global";

const mocks = vi.hoisted(() => ({ push: vi.fn(), addRecord: vi.fn(), findPatientById: vi.fn(), findPossiblePatients: vi.fn(), searchPatients: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/context/AuthContext", () => ({ useCanEdit: () => true }));
vi.mock("@/context/DataContext", () => ({ useData: () => ({ addRecord: mocks.addRecord, medicalHistoryOptions: [] }) }));
vi.mock("@/context/hooks/usePatients", () => ({ usePatients: () => ({ findPatientById: mocks.findPatientById, findPossiblePatients: mocks.findPossiblePatients, searchPatients: mocks.searchPatients }) }));
vi.mock("@/components/records/patient-record-update-form/CaseTypeSelector", () => ({
  CaseTypeSelector: ({ value, onChange }: { value: string; onChange: (value: string) => void }) =>
    <input id="caseType" value={value} onChange={(event) => onChange(event.target.value)} />,
}));
vi.mock("@/components/records/patient-record-update-form/LabSelector", () => ({
  LabSelector: ({ value, onChange }: { value: string; onChange: (value: string) => void }) =>
    <input id="labName" value={value} onChange={(event) => onChange(event.target.value)} />,
}));
beforeEach(() => { vi.clearAllMocks(); mocks.addRecord.mockResolvedValue(undefined); mocks.findPatientById.mockResolvedValue(null); mocks.findPossiblePatients.mockResolvedValue({ patients: [], total: 0 }); mocks.searchPatients.mockResolvedValue({ patients: [], total: 0 }); });
afterEach(cleanup);

function fillGp() {
  fireEvent.change(screen.getByLabelText(/Patient Name/), { target: { value: "Ma Aye" } });
  fireEvent.change(screen.getByLabelText(/^Age/), { target: { value: "40" } });
  fireEvent.click(screen.getByRole("radio", { name: "Female" }));
  fireEvent.change(screen.getByLabelText(/Address/), { target: { value: "North Village" } });
  fireEvent.change(screen.getByLabelText(/Telephone/), { target: { value: "+95 9 123 456" } });
  fireEvent.change(screen.getByLabelText(/Diagnosis & Treatment/), { target: { value: "Scaling" } });
  fireEvent.change(screen.getByLabelText(/Total Cost/), { target: { value: "50000" } });
}

test("opens GP patient and treatment fields directly without registration controls or clinical history", () => {
  render(<NewPatientRecord listPath="/assistant" category={RecordCategory.GP} />);
  for (const label of [/Patient Name/, /^Age/, /Address/, /Diagnosis & Treatment/, /Total Cost/]) {
    expect(screen.getByLabelText(label)).toBeEnabled();
  }
  expect(screen.getByRole("radio", { name: "Female" })).toBeEnabled();
  expect(screen.queryByRole("button", { name: "Patient ID" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Find existing patient" })).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/Drug Allergy/)).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/Past Dental History/)).not.toBeInTheDocument();
  expect(screen.queryByText(/unregistered/i)).not.toBeInTheDocument();
});

test("saves GP demographics on the visit without searching or creating a registry patient", async () => {
  render(<NewPatientRecord listPath="/assistant" category={RecordCategory.GP} />);
  fillGp();
  fireEvent.click(screen.getByRole("button", { name: "Save & back" }));
  await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/assistant"));
  expect(mocks.addRecord).toHaveBeenCalledWith(expect.objectContaining({ category: RecordCategory.GP, diagnosis: "Scaling", total_cost: 50000 }),
    { record_patient: { patient_name: "Ma Aye", age: 40, gender: Gender.FEMALE, address: "North Village", telephone: "+95 9 123 456" } }, 0, expect.any(String));
  expect(mocks.findPossiblePatients).not.toHaveBeenCalled();
  expect(mocks.findPatientById).not.toHaveBeenCalled();
});

test("starts another blank GP entry with the same date and a fresh submission", async () => {
  render(<NewPatientRecord listPath="/admin" category={RecordCategory.GP} />);
  fillGp();
  const date = screen.getByLabelText(/Record date/i) as HTMLInputElement;
  const savedDate = date.value;
  fireEvent.click(screen.getByRole("button", { name: "Save & add another" }));
  await waitFor(() => expect(screen.getByLabelText(/Patient Name/)).toHaveValue(""));
  expect(screen.getByLabelText(/^Age/)).toHaveValue("");
  expect(screen.getByLabelText(/Address/)).toHaveValue("");
  expect(screen.getByLabelText(/Telephone/)).toHaveValue("");
  expect(screen.getByLabelText(/Diagnosis & Treatment/)).toHaveValue("");
  expect(screen.getByLabelText(/Total Cost/)).toHaveValue("");
  expect(date).toHaveValue(savedDate);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  fillGp();
  fireEvent.click(screen.getByRole("button", { name: "Save & back" }));
  await waitFor(() => expect(mocks.addRecord).toHaveBeenCalledTimes(2));
  expect(mocks.addRecord.mock.calls[1][3]).not.toBe(mocks.addRecord.mock.calls[0][3]);
});

test("preserves and locks GP details after an uncertain save and retries the original request", async () => {
  mocks.addRecord.mockRejectedValueOnce(new Error("Response lost"));
  render(<NewPatientRecord listPath="/assistant" category={RecordCategory.GP} />);
  fillGp();
  fireEvent.click(screen.getByRole("button", { name: "Save & back" }));
  await screen.findByText("Response lost");
  expect(screen.getByLabelText(/Patient Name/)).toHaveValue("Ma Aye");
  expect(screen.getByLabelText(/Patient Name/)).toBeDisabled();
  expect(screen.getByLabelText(/Diagnosis & Treatment/)).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Retry save" }));
  await waitFor(() => expect(mocks.addRecord).toHaveBeenCalledTimes(2));
  expect(mocks.addRecord.mock.calls[1]).toEqual(mocks.addRecord.mock.calls[0]);
});

test("validates required GP fields before saving and allows an empty address", async () => {
  render(<NewPatientRecord listPath="/assistant" category={RecordCategory.GP} />);
  fireEvent.click(screen.getByRole("button", { name: "Save & back" }));
  expect(screen.getByText("Patient name is required.")).toBeInTheDocument();
  expect(screen.getByText("Enter a valid age (0-120).")).toBeInTheDocument();
  expect(mocks.addRecord).not.toHaveBeenCalled();
  fillGp();
  fireEvent.change(screen.getByLabelText(/Address/), { target: { value: "" } });
  fireEvent.change(screen.getByLabelText(/Telephone/), { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: "Save & back" }));
  await waitFor(() => expect(mocks.addRecord).toHaveBeenCalled());
  expect(mocks.addRecord.mock.calls[0][1].record_patient.address).toBeUndefined();
  expect(mocks.addRecord.mock.calls[0][1].record_patient.telephone).toBeUndefined();
});
