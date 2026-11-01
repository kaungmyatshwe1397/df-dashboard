// Promotion and unregistration change status on the same permanent profile.
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RegisteredPatientsTable } from "@/components/patients/registeredPatientsTable";
import { Gender, type PatientFiltersType, type PatientType } from "@/lib/global";

const mocks = vi.hoisted(() => ({ search: vi.fn(), registration: vi.fn(), update: vi.fn(), create: vi.fn(), refresh: vi.fn(), canEdit: true }));
vi.mock("@/context/hooks/usePatients", () => ({ usePatients: () => ({ searchPatients: mocks.search,
  setPatientRegistration: mocks.registration, updatePatient: mocks.update, createPatient: mocks.create,
  findPatientById: vi.fn().mockResolvedValue(null), findPossiblePatients: vi.fn().mockResolvedValue({ total: 0, patients: [] }) }) }));
vi.mock("@/context/DataContext", () => ({ useData: () => ({ refreshData: mocks.refresh, medicalHistoryOptions: [] }) }));
vi.mock("@/context/AuthContext", () => ({ useCanEdit: () => mocks.canEdit }));
const patient: PatientType = { id: "permanent-person", patient_id: null, is_registered: false, patient_name: "Ma Aye",
  age: 40, gender: Gender.FEMALE, address: "North Village", current_medications: [], past_medical_history: [] };
beforeEach(() => {
  vi.clearAllMocks(); mocks.canEdit = true;
  mocks.search.mockImplementation(async (filters: PatientFiltersType) => ({ total: 1,
    patients: [{ ...patient, is_registered: filters.registration === "registered", patient_id: filters.registration === "registered" ? "0001/26" : null }] }));
  mocks.registration.mockResolvedValue(patient);
});
afterEach(cleanup);

test("unregistered tab shows name/address and uses its status filter", async () => {
  render(<RegisteredPatientsTable onRowSelect={vi.fn()} />);
  fireEvent.click(screen.getByRole("tab", { name: "Unregistered" }));
  await waitFor(() => expect(mocks.search).toHaveBeenCalledWith(expect.objectContaining({ registration: "unregistered" }), 1));
  expect((await screen.findAllByText("North Village")).length).toBeGreaterThan(0);
  expect(screen.getAllByText("Not assigned").length).toBeGreaterThan(0);
});
test("registration assigns a clinic ID to the existing UUID without inserting another profile", async () => {
  render(<RegisteredPatientsTable onRowSelect={vi.fn()} />);
  fireEvent.click(screen.getByRole("tab", { name: "Unregistered" }));
  fireEvent.click((await screen.findAllByRole("button", { name: "Register" }))[0]);
  const clinicId = `0123/${String(new Date().getFullYear()).slice(-2)}`;
  fireEvent.change(screen.getByLabelText(/Patient ID/), { target: { value: clinicId } });
  fireEvent.click(screen.getByRole("button", { name: "Register Patient" }));
  await waitFor(() => expect(mocks.registration).toHaveBeenCalledWith(patient.id, true, clinicId,
    expect.objectContaining({ patient_name: patient.patient_name, address: patient.address })));
  expect(mocks.create).not.toHaveBeenCalled();
});
test("unregister targets UUID and refreshes visit metadata", async () => {
  render(<RegisteredPatientsTable onRowSelect={vi.fn()} />);
  fireEvent.click((await screen.findAllByRole("button", { name: "Unregister" }))[0]);
  await waitFor(() => expect(mocks.registration).toHaveBeenCalledWith(patient.id, false));
  expect(mocks.refresh).toHaveBeenCalled();
});
test("supervisor can read both tabs but has no create/edit/registration actions", async () => {
  mocks.canEdit = false; render(<RegisteredPatientsTable onRowSelect={vi.fn()} />);
  await screen.findAllByText("Ma Aye");
  expect(screen.queryByRole("button", { name: "Add Patient" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Unregister" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "Unregistered" }));
  await waitFor(() => expect(mocks.search).toHaveBeenCalledWith(expect.objectContaining({ registration: "unregistered" }), 1));
  expect(screen.queryByRole("button", { name: "Register" })).not.toBeInTheDocument();
});
