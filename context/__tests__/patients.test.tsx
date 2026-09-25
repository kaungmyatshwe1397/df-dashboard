// Component Tests — patient registry via DataContext
// findPatientById (global lookup), medical history options loading,
// and latest-record edit lookup.

import { describe, test, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { DataProvider, useData } from "../DataContext";
import { Gender, RecordCategory } from "@/lib/global";

function wrapper({ children }: { children: ReactNode }) {
  return <DataProvider>{children}</DataProvider>;
}

describe("DataContext — Patient Registry", () => {
  describe("findPatientById", () => {
    test("finds a registered patient with demographics", async () => {
      const { result } = renderHook(() => useData(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      let patient = null;
      await act(async () => {
        patient = await result.current.findPatientById("0001/26");
      });

      expect(patient).not.toBeNull();
      expect(patient!.patient_name).toBe("John Doe");
      expect(patient!.age).toBe(34);
      expect(patient!.gender).toBe(Gender.MALE);
      expect(patient!.patient_id).toBe("0001/26");
    });

    test("returns null for an unregistered ID", async () => {
      const { result } = renderHook(() => useData(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      let patient = null;
      await act(async () => {
        patient = await result.current.findPatientById("9999/99");
      });

      expect(patient).toBeNull();
    });

    test("trims surrounding whitespace before lookup", async () => {
      const { result } = renderHook(() => useData(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      let patient = null;
      await act(async () => {
        patient = await result.current.findPatientById("  0003/26  ");
      });

      expect(patient!.patient_name).toBe("Jane Smith");
      expect(patient!.drug_allergy).toBe("Penicillin");
      expect(patient!.current_medications).toEqual(["Metformin"]);
      expect(patient!.past_medical_history).toEqual(["Diabetes"]);
    });
  });

  describe("medicalHistoryOptions", () => {
    test("loads the dynamic picklist from the database", async () => {
      const { result } = renderHook(() => useData(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      const names = result.current.medicalHistoryOptions.map((o) => o.name);
      expect(names).toContain("Heart Disease");
      expect(names).toContain("Diabetes");
      expect(names).toContain("Hypertension");
    });
  });

  describe("findRecordByPatientId — multiple visits", () => {
    test("returns the most recent record for the same patient", async () => {
      const { result } = renderHook(() => useData(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.addRecord(
          {
            patient_id: "0001/26",
            patient_name: "John Doe",
            address: "123 Main St",
            category: RecordCategory.GP,
            diagnosis: "Follow-up visit",
            total_cost: 20000,
          },
          {
            patient_id: "0001/26",
            patient_name: "John Doe",
            age: 34,
            gender: Gender.MALE,
            current_medications: [],
            past_medical_history: [],
          },
          false
        );
      });

      const found = result.current.findRecordByPatientId("0001/26");
      expect(found).toBeDefined();
      // New visit has a later/equal entry_date — must win over the seeded row
      expect(found!.diagnosis).toBe("Follow-up visit");
    });
  });

  describe("updatePatient", () => {
    test("propagates name and address to all of the patient's records", async () => {
      const { result } = renderHook(() => useData(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updatePatient("0001/26", {
          patient_name: "John Doe Jr",
          address: "42 New Street",
        });
      });

      // Registry row updated
      let patient = null;
      await act(async () => {
        patient = await result.current.findPatientById("0001/26");
      });
      expect(patient!.patient_name).toBe("John Doe Jr");
      expect(patient!.address).toBe("42 New Street");

      // Denormalized display copy on the visit record follows
      const record = result.current.findRecordByPatientId("0001/26");
      expect(record!.patient_name).toBe("John Doe Jr");
      expect(record!.address).toBe("42 New Street");
    });

    test("rejects an empty patient ID", async () => {
      const { result } = renderHook(() => useData(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(
        act(async () => {
          await result.current.updatePatient("   ", { patient_name: "X" });
        })
      ).rejects.toThrow(/patient id is required/i);
    });
  });
});
