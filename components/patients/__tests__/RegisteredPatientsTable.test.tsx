// ============================================
// Component Tests — RegisteredPatientsTable
// ============================================
// Tests the 5 UI states (loading, error+retry, empty, ideal, search-no-match)
// plus row-click navigation and pagination.

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  within,
  cleanup,
} from "@testing-library/react";
import { RegisteredPatientsTable } from "../registeredPatientsTable";
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

function makePatient(n: number): PatientType {
  const id = String(n).padStart(4, "0");
  return {
    id: `uuid-${id}`,
    patient_id: `${id}/26`,
    patient_name: `Patient ${n}`,
    age: 30,
    gender: Gender.MALE,
    address: `Street ${n}, Myanmar`,
    created_at: "2026-09-26T12:00:00.000Z",
    current_medications: [],
    past_medical_history: [],
  };
}

function renderTable(onRowSelect = vi.fn()) {
  render(<RegisteredPatientsTable onRowSelect={onRowSelect} />);
  return onRowSelect;
}

beforeEach(() => {
  mock.listPatients.mockReset();
  mock.findPatientById.mockReset();
});

// Vitest runs without globals, so RTL's auto-cleanup never registers and
// portals/containers from earlier tests would leak into later queries.
afterEach(cleanup);

describe("RegisteredPatientsTable — UI States", () => {
  test("loading shows skeletons and no table", () => {
    mock.listPatients.mockReturnValue(new Promise(() => {}));
    renderTable();

    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    expect(screen.queryByText("Patient ID")).not.toBeInTheDocument();
  });

  test("error shows a retry that refetches", async () => {
    mock.listPatients.mockRejectedValueOnce(new Error("Network down"));
    mock.listPatients.mockResolvedValueOnce([makePatient(1)]);
    renderTable();

    const retry = await screen.findByText("Retry");
    expect(screen.getByText("Network down")).toBeInTheDocument();

    fireEvent.click(retry);
    expect(await screen.findByText("Patient 1")).toBeInTheDocument();
    expect(mock.listPatients).toHaveBeenCalledTimes(2);
  });

  test("empty registry shows the empty state", async () => {
    mock.listPatients.mockResolvedValue([]);
    renderTable();

    expect(await screen.findByText("No registered patients yet.")).toBeInTheDocument();
    expect(screen.queryByText("Patient ID")).not.toBeInTheDocument();
  });

  test("rows render with index, ID, date, name, address", async () => {
    mock.listPatients.mockResolvedValue([makePatient(1)]);
    renderTable();

    const row = (await screen.findByText("Patient 1")).closest("tr")!;
    expect(within(row).getByText("1")).toBeInTheDocument();
    expect(within(row).getByText("0001/26")).toBeInTheDocument();
    expect(within(row).getByText("26.9.26")).toBeInTheDocument();
    expect(within(row).getByText("Street 1, Myanmar")).toBeInTheDocument();
  });

  test("missing address renders an em dash", async () => {
    const patient = { ...makePatient(2), address: undefined };
    mock.listPatients.mockResolvedValue([patient]);
    renderTable();

    const row = (await screen.findByText("Patient 2")).closest("tr")!;
    expect(within(row).getByText("—")).toBeInTheDocument();
  });
});

describe("RegisteredPatientsTable — Search", () => {
  test("filters rows by name and shows no-match state", async () => {
    mock.listPatients.mockResolvedValue([
      makePatient(1),
      makePatient(2),
      { ...makePatient(3), patient_name: "Hla Hla" },
    ]);
    renderTable();

    const search = await screen.findByLabelText("Search registered patients");
    expect(screen.getByText("Patient 1")).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "hla" } });
    expect(screen.queryByText("Patient 1")).not.toBeInTheDocument();
    expect(screen.getByText("Hla Hla")).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "zzz" } });
    expect(
      screen.getByText(/No patients match/i)
    ).toBeInTheDocument();
    expect(screen.getByText("0 patients")).toBeInTheDocument();
  });
});

describe("RegisteredPatientsTable — Row click & pagination", () => {
  test("clicking a row reports the patient", async () => {
    mock.listPatients.mockResolvedValue([makePatient(1)]);
    const onRowSelect = vi.fn();
    render(<RegisteredPatientsTable onRowSelect={onRowSelect} />);

    const row = (await screen.findByText("Patient 1")).closest("tr")!;
    fireEvent.click(row);

    expect(onRowSelect).toHaveBeenCalledTimes(1);
    expect(onRowSelect.mock.calls[0][0].patient_id).toBe("0001/26");
  });

  test("paginates beyond 10 rows", async () => {
    mock.listPatients.mockResolvedValue(
      Array.from({ length: 12 }, (_, i) => makePatient(i + 1))
    );
    renderTable();

    await screen.findByText("Patient 1");
    expect(screen.queryByText("Patient 11")).not.toBeInTheDocument();

    const pagination = screen.getByRole("navigation", { name: "pagination" });
    fireEvent.click(within(pagination).getByText("2"));

    expect(await screen.findByText("Patient 11")).toBeInTheDocument();
    expect(screen.queryByText("Patient 1")).not.toBeInTheDocument();
  });
});
