// Record Date is part of the verified visit form and must survive failed saves.

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useData } from "@/context/DataContext";
import { PatientRecordUpdateForm } from "@/components/records/patient-record-update-form";
import { Gender, RecordCategory, type CasePatientRecordType, type GPPatientRecordType } from "@/lib/global";

vi.mock("@/context/DataContext", () => ({ useData: vi.fn() }));

const patient = {
  id: "patient-1", patient_id: "0001/26", patient_name: "Patient One",
  age: 30, gender: Gender.FEMALE, current_medications: [], past_medical_history: [],
};
const gpRecord: GPPatientRecordType = {
  id: "record-1", patient_id: patient.patient_id, patient_name: patient.patient_name,
  entry_date: "2026-08-07", cycle_id: "cycle-aug", month_label: "Aug 2026",
  category: RecordCategory.GP, diagnosis: "Checkup", total_cost: 50000,
};
const caseRecord: CasePatientRecordType = {
  ...gpRecord, category: RecordCategory.CASE, case_type: "Crown", lab_name: "Central Lab",
  lab_send_date: "2026-08-10", delivery_date: "2026-09-25", paid: 20000,
  remaining: 30000, is_carried_forward: false,
};
const addRecord = vi.fn();
const updateRecord = vi.fn();
const findPatientById = vi.fn();

beforeEach(() => {
  vi.setSystemTime(new Date(2026, 8, 15, 0, 15));
  addRecord.mockReset().mockResolvedValue(undefined);
  updateRecord.mockReset().mockResolvedValue(undefined);
  findPatientById.mockReset().mockResolvedValue(patient);
  vi.mocked(useData).mockReturnValue({
    addRecord, updateRecord, findPatientById, deleteRecord: vi.fn(),
    updatePatient: vi.fn().mockResolvedValue(undefined), findRecordByPatientId: vi.fn(),
    medicalHistoryOptions: [], labs: [{ id: "lab-1", lab_name: "Central Lab" }],
    caseTypes: [{ id: "case-type-1", name: "Crown" }],
  } as unknown as ReturnType<typeof useData>);
});
afterEach(() => {
  cleanup();
  vi.setSystemTime(new Date("2026-09-15T12:00:00"));
});

async function openAdd(category: RecordCategory = RecordCategory.GP) {
  const onOpenChange = vi.fn();
  render(<PatientRecordUpdateForm open onOpenChange={onOpenChange} isAdding defaultCategory={category} />);
  expect(screen.queryByLabelText(/Record Date/i)).not.toBeInTheDocument();
  const lookup = screen.getByPlaceholderText("e.g. 0001/26");
  fireEvent.change(lookup, { target: { value: patient.patient_id } });
  fireEvent.keyDown(lookup, { key: "Enter" });
  await screen.findByDisplayValue(patient.patient_name);
  return onOpenChange;
}

function fillGp() {
  fireEvent.change(screen.getByLabelText(/Diagnosis & Treatment/i), { target: { value: "Follow-up" } });
  fireEvent.change(screen.getByLabelText(/Total Cost/i), { target: { value: "75000" } });
}

async function openEdit(record: GPPatientRecordType | CasePatientRecordType) {
  const onOpenChange = vi.fn();
  render(<PatientRecordUpdateForm open onOpenChange={onOpenChange} editRecord={record} defaultCategory={record.category} />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Save Changes" })).not.toBeDisabled());
  return onOpenChange;
}

describe("Record Date in the shared form", () => {
  test("a CASE retry retains its submission identity and independent lab milestones", async () => {
    const onOpenChange = await openAdd(RecordCategory.CASE);
    fireEvent.click(screen.getByText("Select case type"));
    fireEvent.click(await screen.findByRole("option", { name: "Crown" }));
    fireEvent.click(screen.getByText("Select lab"));
    fireEvent.click(await screen.findByRole("option", { name: "Central Lab" }));
    fireEvent.change(screen.getByLabelText(/Total Cost/i), { target: { value: "75000" } });
    fireEvent.change(screen.getByLabelText(/^Paid/i), { target: { value: "20000" } });
    fireEvent.change(screen.getByLabelText("Lab Send Date"), { target: { value: "2026-08-10" } });
    fireEvent.change(screen.getByLabelText("Delivery Date"), { target: { value: "2026-09-25" } });
    fireEvent.change(screen.getByLabelText(/Record Date/i), { target: { value: "2026-08-07" } });
    addRecord.mockRejectedValueOnce(new Error("Connection lost after commit."));
    fireEvent.click(screen.getByRole("button", { name: "Add Record" }));
    await screen.findByText(/Connection lost after commit/i);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Record Date/i)).toHaveValue("2026-08-07");

    const submissionId = addRecord.mock.calls[0][3];
    expect(submissionId).toEqual(expect.any(String));
    fireEvent.click(screen.getByRole("button", { name: "Add Record" }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(addRecord).toHaveBeenNthCalledWith(2, expect.objectContaining({
      entry_date: "2026-08-07", lab_send_date: "2026-08-10", delivery_date: "2026-09-25", paid: 20000,
    }), patient.patient_id, 20000, submissionId);
  });
  test.each([RecordCategory.GP, RecordCategory.CASE])("%s add shows required local today only after patient verification", async (category) => {
    await openAdd(category);
    const date = screen.getByLabelText(/Record Date/i);
    expect(date).toHaveValue("2026-09-15");
    expect(date).toBeRequired();
    expect(date).toHaveAttribute("max", "2026-09-15");
    expect(date.compareDocumentPosition(screen.getByLabelText(/Total Cost/i)) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.change(date, { target: { value: "2026-07-31" } });
    expect(date).toHaveValue("2026-07-31");
  });

  test.each([RecordCategory.GP, RecordCategory.CASE])("%s add rejects an empty record date", async (category) => {
    const onOpenChange = await openAdd(category);
    fireEvent.change(screen.getByLabelText(/Record Date/i), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Record" }));
    expect(screen.getByText("Record date is required.")).toBeInTheDocument();
    expect(screen.getByLabelText(/Record Date/i)).toHaveAttribute("aria-invalid", "true");
    expect(addRecord).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  test.each([RecordCategory.GP, RecordCategory.CASE])("%s add rejects future dates", async (category) => {
    await openAdd(category);
    fireEvent.change(screen.getByLabelText(/Record Date/i), { target: { value: "2026-09-16" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Record" }));
    expect(screen.getByText("Record date cannot be in the future.")).toBeInTheDocument();
    expect(addRecord).not.toHaveBeenCalled();
  });

  test("passes the chosen GP date into the save payload", async () => {
    const onOpenChange = await openAdd();
    fillGp();
    fireEvent.change(screen.getByLabelText(/Record Date/i), { target: { value: "2026-07-31" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Record" }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(addRecord).toHaveBeenCalledWith(expect.objectContaining({ entry_date: "2026-07-31", diagnosis: "Follow-up" }), patient.patient_id, undefined, expect.any(String));
  });

  test.each(["Failed to create the month bucket.", "Failed to save record."])("preserves all values on save failure: %s", async (message) => {
    const onOpenChange = await openAdd();
    fillGp();
    fireEvent.change(screen.getByLabelText(/Record Date/i), { target: { value: "2026-07-31" } });
    let rejectSave!: (error: Error) => void;
    addRecord.mockImplementationOnce(() => new Promise((_, reject) => { rejectSave = reject; }));
    fireEvent.click(screen.getByRole("button", { name: "Add Record" }));
    expect(screen.getByLabelText(/Record Date/i)).toBeDisabled();
    await act(async () => rejectSave(new Error(message)));

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByLabelText(/Record Date/i)).toHaveValue("2026-07-31");
    expect(screen.getByLabelText(/Record Date/i)).not.toBeDisabled();
    expect(screen.getByLabelText(/Diagnosis & Treatment/i)).toHaveValue("Follow-up");
    expect(screen.getByLabelText(/Total Cost/i)).toHaveValue("75000");
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  test.each([gpRecord, caseRecord])("prefills and updates the stored $category date", async (record) => {
    const onOpenChange = await openEdit(record);
    const date = screen.getByLabelText(/Record Date/i);
    expect(date).toHaveValue("2026-08-07");
    fireEvent.change(date, { target: { value: "2026-07-15" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(updateRecord).toHaveBeenCalledWith(record.id, expect.objectContaining({ entry_date: "2026-07-15" }));
    if (record.category === RecordCategory.CASE) {
      expect(updateRecord).toHaveBeenCalledWith(record.id, expect.objectContaining({ lab_send_date: "2026-08-10", delivery_date: "2026-09-25", paid: 20000 }));
      expect(screen.getByLabelText("Lab Send Date")).toHaveValue("2026-08-10");
      expect(screen.getByLabelText("Delivery Date")).toHaveValue("2026-09-25");
    }
  });

  test("keeps the edit date and lab milestones after a failed update", async () => {
    const onOpenChange = await openEdit(caseRecord);
    updateRecord.mockRejectedValueOnce(new Error("Failed to update record."));
    fireEvent.change(screen.getByLabelText(/Record Date/i), { target: { value: "2026-07-15" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    await screen.findByText("Failed to update record.");
    expect(screen.getByLabelText(/Record Date/i)).toHaveValue("2026-07-15");
    expect(screen.getByLabelText("Lab Send Date")).toHaveValue("2026-08-10");
    expect(screen.getByLabelText("Delivery Date")).toHaveValue("2026-09-25");
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
