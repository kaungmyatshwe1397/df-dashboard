// A slower response for an earlier query must not replace the current search results.
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { PatientSearch } from "@/components/patients/patientSearch";
import { Gender, type PatientSearchResultType } from "@/lib/global";

const mocks = vi.hoisted(() => ({ search: vi.fn() }));
vi.mock("@/context/hooks/usePatients", () => ({ usePatients: () => ({ searchPatients: mocks.search }) }));
afterEach(cleanup);
test("ignores a stale search response after the filters change", async () => {
  let resolveFirst!: (result: PatientSearchResultType) => void;
  let resolveSecond!: (result: PatientSearchResultType) => void;
  mocks.search.mockReset().mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
    .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve; }));
  render(<PatientSearch onSelect={vi.fn()} />);
  await waitFor(() => expect(mocks.search).toHaveBeenCalledTimes(1));
  fireEvent.change(screen.getByLabelText("Name or clinic ID"), { target: { value: "Current" } });
  await waitFor(() => expect(mocks.search).toHaveBeenCalledTimes(2));
  const profile = { id: "current", patient_name: "Current Patient", patient_id: null, is_registered: false,
    age: 30, gender: Gender.FEMALE, current_medications: [], past_medical_history: [] };
  await act(async () => resolveSecond({ total: 1, patients: [profile] }));
  expect(screen.getByText("Current Patient")).toBeInTheDocument();
  await act(async () => resolveFirst({ total: 1, patients: [{ ...profile, id: "stale", patient_name: "Stale Patient" }] }));
  expect(screen.queryByText("Stale Patient")).not.toBeInTheDocument();
  expect(screen.getByText("Current Patient")).toBeInTheDocument();
});
