// Mobile patient selection retains full identity and clear missing-value labels.

import { test, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PatientCard } from "@/components/patients/registeredPatientsTable/patientCard";
import { Gender, type PatientType } from "@/lib/global";

test("patient cards show full identity and open the selected patient", () => {
  const patient: PatientType = {
    id: "patient-1", patient_id: "0001/26", patient_name: "A long patient name for mobile",
    age: 30, gender: Gender.OTHER, current_medications: [], past_medical_history: [],
    created_at: "2026-10-01",
  };
  const onSelect = vi.fn();
  render(<PatientCard patient={patient} onSelect={onSelect} />);
  expect(screen.getByText(patient.patient_name)).toBeInTheDocument();
  expect(screen.getByText("0001/26")).toBeInTheDocument();
  expect(screen.getByText("Not provided")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /view patient/i }));
  expect(onSelect).toHaveBeenCalledWith(patient);
});
