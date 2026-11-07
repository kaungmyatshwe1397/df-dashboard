// Case entry retains clinic identity checks, registration, patient selection, and retry behavior.
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NewPatientRecord } from "@/components/records/newPatientRecord";
import { Gender, RecordCategory, type PatientType } from "@/lib/global";
import { currentYearSuffix } from "@/components/records/patient-record-update-form/schema";
import { RecordSaveError } from "@/lib/services/atomicRecordSaveService";

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

function completeCaseFields() {
  const lab = screen.getByLabelText(/Lab Name/) as HTMLInputElement;
  const paid = screen.getByLabelText(/Paid/) as HTMLInputElement;
  if (!lab.value) fireEvent.change(lab, { target: { value: "Dental Lab" } });
  if (!paid.value) fireEvent.change(paid, { target: { value: "0" } });
}


test("checks an existing clinic ID and requires the matching patient to be confirmed", async () => {
  const patient: PatientType = { id: "person-1", patient_id: "0001/26", is_registered: true, patient_name: "Ma Aye", age: 40, gender: Gender.FEMALE, address: "North Village", current_medications: [], past_medical_history: [] };
  mocks.findPatientById.mockResolvedValue(patient);
  render(<NewPatientRecord listPath="/assistant" category={RecordCategory.CASE} />);
  fireEvent.click(screen.getByRole("button", { name: "Patient ID" }));
  fireEvent.change(screen.getByLabelText("Clinic ID"), { target: { value: "000126" } });
  fireEvent.click(screen.getByRole("button", { name: "Check ID" }));
  expect(await screen.findByText(/Confirm this is the correct patient/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(await screen.findByLabelText(/Patient Name/)).toHaveValue("Ma Aye");
  expect(screen.getByLabelText(/Patient Name/)).toBeDisabled();
});

test("saves a new registered patient and starts a fresh entry", async () => {
  const clinicId = `0123/${currentYearSuffix()}`;
  render(<NewPatientRecord listPath="/assistant" category={RecordCategory.CASE} />);
  fireEvent.click(screen.getByRole("button", { name: "Patient ID" }));
  fireEvent.change(screen.getByLabelText("Clinic ID"), { target: { value: clinicId } });
  fireEvent.click(screen.getByRole("button", { name: "Check ID" }));
  expect(await screen.findByText(/No patient has this ID/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.change(await screen.findByLabelText(/Patient Name/), { target: { value: "New Person" } });
  fireEvent.change(screen.getByLabelText(/Age/), { target: { value: "30" } });
  fireEvent.change(screen.getByLabelText(/Case Type/), { target: { value: "Checkup" } });
  fireEvent.change(screen.getByLabelText(/Total Cost/), { target: { value: "50000" } });
  completeCaseFields();
  fireEvent.click(screen.getByRole("button", { name: "Save & add another" }));
  await waitFor(() => expect(mocks.addRecord).toHaveBeenCalledWith(expect.objectContaining({ diagnosis: "Checkup" }), expect.objectContaining({ new_patient: expect.objectContaining({ patient_id: clinicId, patient_name: "New Person" }) }), 0, expect.any(String)));
  expect(await screen.findByRole("dialog", { name: "Patient ID" })).toBeInTheDocument();
  expect(screen.getByLabelText("Clinic ID")).toHaveValue("");
  expect(mocks.push).not.toHaveBeenCalled();
});

test("rejects an unknown past-year ID but permits entry without an ID", async () => {
  const olderYear = String((Number(currentYearSuffix()) + 99) % 100).padStart(2, "0");
  render(<NewPatientRecord listPath="/assistant" category={RecordCategory.CASE} />);
  fireEvent.click(screen.getByRole("button", { name: "Patient ID" }));
  fireEvent.change(screen.getByLabelText("Clinic ID"), { target: { value: `4321/${olderYear}` } });
  fireEvent.click(screen.getByRole("button", { name: "Check ID" }));
  expect(await screen.findByText(/year must match the current year/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Unregistered" }));
  expect(await screen.findByLabelText(/Patient Name/)).toHaveValue("");
  expect(screen.getByText("New unregistered patient")).toBeInTheDocument();
  expect(screen.queryByRole("radio", { name: "Other" })).not.toBeInTheDocument();
});

test("saves a Case visit with its initial payment and returns to the Case tab", async () => {
  render(<NewPatientRecord listPath="/assistant" category={RecordCategory.CASE} />);
  fireEvent.click(screen.getByRole("button", { name: "Patient ID" }));
  fireEvent.click(screen.getByRole("button", { name: "Unregistered" }));
  fireEvent.change(await screen.findByLabelText(/Patient Name/), { target: { value: "Case Person" } });
  fireEvent.change(screen.getByLabelText(/Age/), { target: { value: "27" } });
  fireEvent.change(screen.getByLabelText(/Case Type/), { target: { value: "Crown" } });
  fireEvent.change(screen.getByLabelText(/Lab Name/), { target: { value: "Dental Lab" } });
  fireEvent.change(screen.getByLabelText(/Total Cost/), { target: { value: "100000" } });
  fireEvent.change(screen.getByLabelText(/Paid/), { target: { value: "25000" } });
  completeCaseFields();
  fireEvent.click(screen.getByRole("button", { name: "Save & back" }));
  await waitFor(() => expect(mocks.addRecord).toHaveBeenCalledWith(
    expect.objectContaining({ category: RecordCategory.CASE, diagnosis: "Crown", case_type: "Crown", lab_name: "Dental Lab", total_cost: 100000 }),
    expect.objectContaining({ new_patient: expect.objectContaining({ patient_name: "Case Person", patient_id: undefined }) }),
    25000, expect.any(String),
  ));
  await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/assistant?tab=case"));
});

test("retains the same submission ID after an uncertain save response", async () => {
  mocks.addRecord.mockRejectedValueOnce(new Error("Response lost"));
  render(<NewPatientRecord listPath="/assistant" category={RecordCategory.CASE} />);
  fireEvent.click(screen.getByRole("button", { name: "Patient ID" }));
  fireEvent.click(screen.getByRole("button", { name: "Unregistered" }));
  fireEvent.change(await screen.findByLabelText(/Patient Name/), { target: { value: "Retry Person" } });
  fireEvent.change(screen.getByLabelText(/Age/), { target: { value: "35" } });
  fireEvent.change(screen.getByLabelText(/Case Type/), { target: { value: "Cleaning" } });
  fireEvent.change(screen.getByLabelText(/Total Cost/), { target: { value: "50000" } });
  completeCaseFields();
  fireEvent.click(screen.getByRole("button", { name: "Save & back" }));
  expect(await screen.findByText("Response lost")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Patient ID" })).toBeDisabled();
  completeCaseFields();
  fireEvent.click(screen.getByRole("button", { name: "Save & back" }));
  await waitFor(() => expect(mocks.addRecord).toHaveBeenCalledTimes(2));
  expect(mocks.addRecord.mock.calls[1][3]).toBe(mocks.addRecord.mock.calls[0][3]);
});

test("keeps treatment details when the patient choice changes", async () => {
  render(<NewPatientRecord listPath="/assistant" category={RecordCategory.CASE} />);
  fireEvent.click(screen.getByRole("button", { name: "Patient ID" }));
  fireEvent.click(screen.getByRole("button", { name: "Unregistered" }));
  fireEvent.change(await screen.findByLabelText(/Patient Name/), { target: { value: "First Person" } });
  fireEvent.change(screen.getByLabelText(/Case Type/), { target: { value: "Cleaning" } });
  fireEvent.change(screen.getByLabelText(/Total Cost/), { target: { value: "50000" } });
  fireEvent.click(screen.getByRole("button", { name: "Patient ID" }));
  fireEvent.click(screen.getByRole("button", { name: "Unregistered" }));
  expect(await screen.findByLabelText(/Patient Name/)).toHaveValue("");
  expect(screen.getByLabelText(/Case Type/)).toHaveValue("Cleaning");
  expect(screen.getByLabelText(/Total Cost/)).toHaveValue("50000");
});

test("finds a returning patient who has no clinic ID", async () => {
  const patient: PatientType = { id: "person-2", patient_id: null, is_registered: false, patient_name: "Returning Person", age: 42, gender: Gender.FEMALE, address: "North Village", current_medications: [], past_medical_history: [] };
  mocks.searchPatients.mockResolvedValue({ patients: [patient], total: 1 });
  render(<NewPatientRecord listPath="/assistant" category={RecordCategory.CASE} />);
  fireEvent.click(screen.getByRole("button", { name: "Find existing patient" }));
  fireEvent.click(await screen.findByRole("button", { name: /Select Returning Person/ }));
  expect(await screen.findByLabelText(/Patient Name/)).toHaveValue("Returning Person");
  expect(screen.queryByText("Find existing patient", { selector: "h3" })).not.toBeInTheDocument();
});

test("assigns a checked new ID when an existing unregistered match is selected", async () => {
  const clinicId = `0456/${currentYearSuffix()}`;
  const patient: PatientType = { id: "person-3", patient_id: null, is_registered: false, patient_name: "Matching Person", age: 28, gender: Gender.MALE, address: "West Village", current_medications: [], past_medical_history: [] };
  mocks.findPossiblePatients.mockResolvedValue({ patients: [patient], total: 1 });
  render(<NewPatientRecord listPath="/assistant" category={RecordCategory.CASE} />);
  fireEvent.click(screen.getByRole("button", { name: "Patient ID" }));
  fireEvent.change(screen.getByLabelText("Clinic ID"), { target: { value: clinicId } });
  fireEvent.click(screen.getByRole("button", { name: "Check ID" }));
  expect(await screen.findByText(/No patient has this ID/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.change(await screen.findByLabelText(/Patient Name/), { target: { value: "Matching Person" } });
  fireEvent.change(screen.getByLabelText(/Age/), { target: { value: "28" } });
  fireEvent.change(screen.getByLabelText(/Case Type/), { target: { value: "Checkup" } });
  fireEvent.change(screen.getByLabelText(/Total Cost/), { target: { value: "50000" } });
  completeCaseFields();
  fireEvent.click(screen.getByRole("button", { name: "Save & back" }));
  fireEvent.click(await screen.findByRole("button", { name: /Select Matching Person/ }));
  completeCaseFields();
  fireEvent.click(screen.getByRole("button", { name: "Save & back" }));
  await waitFor(() => expect(mocks.addRecord).toHaveBeenCalledWith(expect.any(Object),
    { existing_patient_uuid: patient.id, register_existing: true, register_patient_id: clinicId }, 0, expect.any(String)));
});

test("allows correcting a clinic ID after a confirmed uniqueness rejection", async () => {
  mocks.addRecord.mockRejectedValueOnce(new RecordSaveError("Clinic ID conflict", "23505"));
  render(<NewPatientRecord listPath="/assistant" category={RecordCategory.CASE} />);
  fireEvent.click(screen.getByRole("button", { name: "Patient ID" }));
  fireEvent.change(screen.getByLabelText("Clinic ID"), { target: { value: `0456/${currentYearSuffix()}` } });
  fireEvent.click(screen.getByRole("button", { name: "Check ID" }));
  expect(await screen.findByText(/No patient has this ID/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.change(await screen.findByLabelText(/Patient Name/), { target: { value: "New Person" } });
  fireEvent.change(screen.getByLabelText(/Age/), { target: { value: "30" } });
  fireEvent.change(screen.getByLabelText(/Case Type/), { target: { value: "Checkup" } });
  fireEvent.change(screen.getByLabelText(/Total Cost/), { target: { value: "50000" } });
  completeCaseFields();
  fireEvent.click(screen.getByRole("button", { name: "Save & back" }));
  expect(await screen.findByText(/clinic ID was assigned/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Patient ID" }));
  fireEvent.change(screen.getByLabelText("Clinic ID"), { target: { value: `0457/${currentYearSuffix()}` } });
  fireEvent.click(screen.getByRole("button", { name: "Check ID" }));
  expect(await screen.findByText(/No patient has this ID/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(await screen.findByLabelText(/Case Type/)).toHaveValue("Checkup");
  completeCaseFields();
  fireEvent.click(screen.getByRole("button", { name: "Save & back" }));
  await waitFor(() => expect(mocks.addRecord).toHaveBeenCalledTimes(2));
  expect(mocks.addRecord.mock.calls[1][3]).not.toBe(mocks.addRecord.mock.calls[0][3]);
});

test("does not carry a rejected ID when selecting an existing unregistered patient", async () => {
  const patient: PatientType = { id: "person-4", patient_id: null, is_registered: false, patient_name: "Existing Person", age: 30, gender: Gender.MALE, address: "Village", current_medications: [], past_medical_history: [] };
  mocks.searchPatients.mockResolvedValue({ patients: [patient], total: 1 });
  mocks.addRecord.mockRejectedValueOnce(new RecordSaveError("Clinic ID conflict", "23505"));
  render(<NewPatientRecord listPath="/assistant" category={RecordCategory.CASE} />);
  fireEvent.click(screen.getByRole("button", { name: "Patient ID" }));
  fireEvent.change(screen.getByLabelText("Clinic ID"), { target: { value: `0456/${currentYearSuffix()}` } });
  fireEvent.click(screen.getByRole("button", { name: "Check ID" }));
  expect(await screen.findByText(/No patient has this ID/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.change(await screen.findByLabelText(/Patient Name/), { target: { value: "New Person" } });
  fireEvent.change(screen.getByLabelText(/Age/), { target: { value: "30" } });
  fireEvent.change(screen.getByLabelText(/Case Type/), { target: { value: "Checkup" } });
  fireEvent.change(screen.getByLabelText(/Total Cost/), { target: { value: "50000" } });
  completeCaseFields();
  fireEvent.click(screen.getByRole("button", { name: "Save & back" }));
  expect(await screen.findByText(/clinic ID was assigned/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Find existing patient" }));
  fireEvent.click(await screen.findByRole("button", { name: /Select Existing Person/ }));
  completeCaseFields();
  fireEvent.click(screen.getByRole("button", { name: "Save & back" }));
  await waitFor(() => expect(mocks.addRecord).toHaveBeenCalledTimes(2));
  expect(mocks.addRecord.mock.calls[1][1]).toEqual({ existing_patient_uuid: patient.id, register_existing: false, register_patient_id: undefined });
});
