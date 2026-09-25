// Unit Tests — patientRecordService
// Error mapping for the atomic patient+record registration RPC.

import { describe, test, expect, vi } from "vitest";
import { registerPatientWithRecord, DUPLICATE_PATIENT_ID_MESSAGE } from "../patientRecordService";
import { Gender, PatientPayloadType } from "@/lib/global";

const patient: PatientPayloadType = {
  patient_id: "0001/26",
  patient_name: "MGMG",
  age: 22,
  gender: Gender.MALE,
  current_medications: [],
  past_medical_history: ["Diabetes"],
};

const recordRow = {
  id: "rec-x",
  cycle_id: "cycle-001",
  patient_id: "0001/26",
  entry_date: "2026-09-24",
  patient_name: "MGMG",
  category: "GP",
  diagnosis: "Checkup",
  total_cost: 50000,
  month_label: "Sep 2026",
};

describe("patientRecordService — registerPatientWithRecord", () => {
  test("returns the inserted record on success", async () => {
    const fake = {
      rpc: vi.fn().mockResolvedValue({
        data: { patient_id: "pat-1", record: recordRow },
        error: null,
      }),
    };
    const result = await registerPatientWithRecord(
      fake as never,
      patient,
      recordRow,
      true
    );
    expect(result.id).toBe("rec-x");
    expect(result.patient_id).toBe("0001/26");
    expect(fake.rpc).toHaveBeenCalledWith("register_patient_with_record", {
      p_patient: patient,
      p_record: recordRow,
      p_is_new_patient: true,
    });
  });

  test("maps unique-violation (23505) to the friendly duplicate message", async () => {
    const fake = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { code: "23505", message: "duplicate key value" },
      }),
    };
    await expect(
      registerPatientWithRecord(fake as never, patient, recordRow, true)
    ).rejects.toThrow(DUPLICATE_PATIENT_ID_MESSAGE);
    expect(DUPLICATE_PATIENT_ID_MESSAGE).toBe(
      "The patient ID is already registered for another person. Check your patient ID again."
    );
  });

  test("passes through other database errors", async () => {
    const fake = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { code: "23503", message: "violates foreign key" },
      }),
    };
    await expect(
      registerPatientWithRecord(fake as never, patient, recordRow, true)
    ).rejects.toThrow("violates foreign key");
  });

  test("throws when RPC returns no record (nothing committed client-side)", async () => {
    const fake = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    await expect(
      registerPatientWithRecord(fake as never, patient, recordRow, true)
    ).rejects.toThrow("Failed to save patient record.");
  });
});
