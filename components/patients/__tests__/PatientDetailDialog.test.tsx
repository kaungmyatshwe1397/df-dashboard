// ============================================
// Component Tests — PatientDetailDialog
// ============================================
// Tests the found / not-found / error states, the read-only field grid,
// and the back-to-list action.

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { PatientDetailDialog } from "../registeredPatientsTable";
import { PatientType, Gender } from "@/lib/global";

const mock = vi.hoisted(() => ({
  listPatients: vi.fn(),
  findPatientById: vi.fn(),
}));

vi.mock("@/context/hooks/usePatients", () => ({
  usePatients: () => ({
    listPatients: mock.listPatients,
    findPatientById: mock.findPatientById,
  }),
}));

const patient: PatientType = {
  id: "uuid-1",
  patient_id: "0001/26",
  patient_name: "MgMg",
  age: 34,
  gender: Gender.MALE,
  address: "Number one street, Myanmar",
  drug_allergy: "Penicillin",
  past_dental_history: "Extracted 36",
  past_medical_history: ["Diabetes"],
  current_medications: ["Metformin"],
  created_at: "2026-09-26T12:00:00.000Z",
};

function getDialogContent(): HTMLElement {
  const dialogs = document.querySelectorAll("[data-slot='dialog-content']");
  return dialogs[dialogs.length - 1] as HTMLElement;
}

beforeEach(() => {
  mock.listPatients.mockReset();
  mock.findPatientById.mockReset();
});

// Vitest runs without globals, so RTL's auto-cleanup never registers and
// the dialog portal from earlier tests would leak into later queries.
afterEach(cleanup);

describe("PatientDetailDialog — Found", () => {
  test("renders all registry demographics", async () => {
    mock.findPatientById.mockResolvedValue(patient);
    render(<PatientDetailDialog patientId="0001/26" onClose={vi.fn()} />);

    expect(await screen.findByText("MgMg")).toBeInTheDocument();

    const dialog = getDialogContent();
    expect(dialog).toBeInTheDocument();
    expect(screen.getAllByText("0001/26").length).toBeGreaterThan(0);
    expect(screen.getByText("26 September 2026")).toBeInTheDocument();
    expect(screen.getByText("34 years")).toBeInTheDocument();
    expect(screen.getByText("MALE")).toBeInTheDocument();
    expect(screen.getByText("Number one street, Myanmar")).toBeInTheDocument();
    expect(screen.getByText("Penicillin")).toBeInTheDocument();
    expect(screen.getByText("Extracted 36")).toBeInTheDocument();
    expect(screen.getByText("Diabetes")).toBeInTheDocument();
    expect(screen.getByText("Metformin")).toBeInTheDocument();
  });

  test("Back to list calls onClose", async () => {
    mock.findPatientById.mockResolvedValue(patient);
    const onClose = vi.fn();
    render(<PatientDetailDialog patientId="0001/26" onClose={onClose} />);

    fireEvent.click(await screen.findByText("Back to list"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("PatientDetailDialog — Edge States", () => {
  test("unknown ID shows the not-found state", async () => {
    mock.findPatientById.mockResolvedValue(null);
    render(<PatientDetailDialog patientId="9999/26" onClose={vi.fn()} />);

    expect(
      await screen.findByText(/was not found/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId("patient-not-found")).toBeInTheDocument();
    expect(screen.queryByText("MgMg")).not.toBeInTheDocument();
  });

  test("missing ID skips the lookup entirely", async () => {
    render(<PatientDetailDialog patientId="" onClose={vi.fn()} />);

    expect(await screen.findByText("No Patient ID was provided.")).toBeInTheDocument();
    expect(mock.findPatientById).not.toHaveBeenCalled();
  });

  test("fetch failure shows an error with retry", async () => {
    mock.findPatientById
      .mockRejectedValueOnce(new Error("Network down"))
      .mockResolvedValueOnce(patient);
    render(<PatientDetailDialog patientId="0001/26" onClose={vi.fn()} />);

    expect(await screen.findByText("Network down")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Retry"));
    expect(await screen.findByText("MgMg")).toBeInTheDocument();
  });
});
