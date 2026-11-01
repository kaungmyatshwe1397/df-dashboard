// Form behavior covers identity-free entry, explicit patient selection, draft retention, and retries.
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { PatientRecordUpdateForm } from "@/components/records/patient-record-update-form";
import { useRecordForm } from "@/components/records/patient-record-update-form/useRecordForm";
import { Gender, RecordCategory, type PatientType, type GPPatientRecordType } from "@/lib/global";

const mocks = vi.hoisted(() => ({ add: vi.fn(), update: vi.fn(), remove: vi.fn(), updatePatient: vi.fn(), refresh: vi.fn(), find: vi.fn(), duplicates: vi.fn() }));
vi.mock("@/context/DataContext", () => ({ useData: () => ({ addRecord: mocks.add, updateRecord: mocks.update, deleteRecord: mocks.remove,
  updatePatient: mocks.updatePatient, refreshData: mocks.refresh, medicalHistoryOptions: [], records: [] }) }));
vi.mock("@/context/hooks/usePatients", () => ({ usePatients: () => ({ findPatientByUuid: mocks.find, findPossiblePatients: mocks.duplicates }) }));
vi.mock("@/components/patients/patientSearch", () => ({ PatientSearch: ({ onSelect, onCreate }: { onSelect: (patient: PatientType) => void; onCreate: () => void }) =>
  <div><button onClick={() => onSelect(patient)}>Select existing patient</button><button onClick={onCreate}>New unregistered patient</button></div> }));

const patient: PatientType = { id: "patient-uuid", patient_id: null, is_registered: false, patient_name: "Ma Aye", age: 40,
  gender: Gender.FEMALE, address: "North Village", current_medications: [], past_medical_history: [] };
const record: GPPatientRecordType = { id: "visit-uuid", patient_uuid: patient.id, patient_id: null, patient_name: patient.patient_name,
  cycle_id: "cycle", entry_date: "2026-09-01", category: RecordCategory.GP, diagnosis: "Checkup", total_cost: 5000, month_label: "Sep 2026" };
beforeEach(() => {
  vi.clearAllMocks(); mocks.add.mockResolvedValue(undefined); mocks.update.mockResolvedValue(undefined); mocks.remove.mockResolvedValue(undefined);
  mocks.updatePatient.mockResolvedValue(undefined); mocks.find.mockResolvedValue(patient); mocks.duplicates.mockResolvedValue({ patients: [], total: 0 });
});
afterEach(cleanup);
function addForm() { const close = vi.fn(); render(<PatientRecordUpdateForm open isAdding onOpenChange={close} />); return close; }
function treatment() {
  fireEvent.change(screen.getByLabelText(/Diagnosis & Treatment/), { target: { value: "Scaling" } });
  fireEvent.change(screen.getByLabelText(/Total Cost/), { target: { value: "5000" } });
}
function newPatient() {
  fireEvent.click(screen.getByRole("button", { name: "New unregistered patient" }));
  fireEvent.change(screen.getByLabelText(/Patient Name/), { target: { value: "New Person" } });
  fireEvent.change(screen.getByLabelText(/^Age/), { target: { value: "30" } }); treatment();
}

test("new unregistered entry omits the clinic ID and atomically submits demographics", async () => {
  const close = addForm(); newPatient();
  expect(screen.queryByLabelText(/Patient ID/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Add Record" }));
  await waitFor(() => expect(close).toHaveBeenCalledWith(false));
  expect(mocks.add).toHaveBeenCalledWith(expect.objectContaining({ diagnosis: "Scaling", total_cost: 5000 }),
    { new_patient: expect.objectContaining({ patient_name: "New Person", age: 30 }) }, 0, expect.any(String));
});
test("an existing unregistered patient is selected using UUID without an ID requirement", async () => {
  addForm(); fireEvent.click(screen.getByRole("button", { name: "Select existing patient" })); treatment();
  fireEvent.click(screen.getByRole("button", { name: "Add Record" }));
  await waitFor(() => expect(mocks.add).toHaveBeenCalled());
  expect(mocks.add.mock.calls[0][1]).toEqual({ existing_patient_uuid: patient.id });
  expect(mocks.duplicates).not.toHaveBeenCalled();
});
test("switching patients keeps the treatment draft", () => {
  addForm(); fireEvent.click(screen.getByRole("button", { name: "Select existing patient" })); treatment();
  fireEvent.click(screen.getByRole("button", { name: "Change Patient" }));
  fireEvent.click(screen.getByRole("button", { name: "New unregistered patient" }));
  expect(screen.getByLabelText(/Diagnosis & Treatment/)).toHaveValue("Scaling");
});
test("failed saves retain fields and reuse the submission UUID", async () => {
  addForm(); newPatient(); mocks.add.mockRejectedValueOnce(new Error("Connection lost"));
  fireEvent.click(screen.getByRole("button", { name: "Add Record" })); await screen.findByText("Connection lost");
  expect(screen.getByLabelText(/Patient Name/)).toHaveValue("New Person");
  const first = mocks.add.mock.calls[0];
  fireEvent.click(screen.getByRole("button", { name: "Add Record" }));
  await waitFor(() => expect(mocks.add).toHaveBeenCalledTimes(2));
  expect(mocks.add.mock.calls[1]).toEqual(first);
});
test("potential matches require a separate-person confirmation", async () => {
  addForm(); newPatient(); mocks.duplicates.mockResolvedValue({ patients: [patient], total: 1 });
  fireEvent.click(screen.getByRole("button", { name: "Add Record" }));
  await screen.findByText(/existing patients have the same name/); expect(mocks.add).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: /This is a different person/ }));
  await waitFor(() => expect(mocks.add).toHaveBeenCalledTimes(1));
});
test("invalid demographics stop new-profile submission", () => {
  addForm(); fireEvent.click(screen.getByRole("button", { name: "New unregistered patient" })); treatment();
  fireEvent.click(screen.getByRole("button", { name: "Add Record" }));
  expect(screen.getByText("Patient name is required.")).toBeInTheDocument(); expect(mocks.add).not.toHaveBeenCalled();
});
test("edit and delete use the selected visit UUID and profile UUID", async () => {
  const close = vi.fn(); render(<PatientRecordUpdateForm open editRecord={record} onOpenChange={close} />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Save Changes" })).not.toBeDisabled());
  fireEvent.change(screen.getByLabelText(/Patient Name/), { target: { value: "Updated Aye" } });
  fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
  await waitFor(() => expect(mocks.update).toHaveBeenCalledWith(record.id, expect.objectContaining({ entry_date: record.entry_date })));
  expect(mocks.updatePatient).toHaveBeenCalledWith(patient.id, expect.objectContaining({ patient_name: "Updated Aye" }));
});
test("delete waits for failure and leaves the dialog open", async () => {
  const close = vi.fn(); mocks.remove.mockRejectedValueOnce(new Error("Unavailable"));
  render(<PatientRecordUpdateForm open editRecord={record} onOpenChange={close} />);
  fireEvent.click(screen.getByRole("button", { name: "Delete" }));
  await screen.findByText("Could not delete the record. Please retry.");
  expect(close).not.toHaveBeenCalled(); expect(mocks.remove).toHaveBeenCalledWith(record.id);
});

test("a failed profile lookup for the next selected visit cannot reuse the previous patient's draft", async () => {
  const next = { ...record, id: "second-visit", patient_uuid: "second-person", patient_name: "Second Patient", diagnosis: "Extraction" };
  const { result } = renderHook(() => useRecordForm({ open: true, onOpenChange: vi.fn(), isAdding: false }));
  act(() => result.current.setRecord(record));
  await waitFor(() => expect(result.current.patient?.id).toBe(patient.id));
  act(() => result.current.setRecord(null));
  mocks.find.mockRejectedValueOnce(new Error("Lookup unavailable"));
  act(() => result.current.setRecord(next));
  await waitFor(() => expect(result.current.loadingPatient).toBe(false));
  expect(result.current.patient).toBeNull();
  expect(result.current.form.diagnosis).toBe("Extraction");
  await act(async () => result.current.save());
  expect(mocks.updatePatient).not.toHaveBeenCalled();
  expect(mocks.update).toHaveBeenCalledWith(next.id, expect.objectContaining({ diagnosis: "Extraction" }));
});
