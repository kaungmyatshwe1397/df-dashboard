// Unit Tests — patientRecordService
// Error mapping for the atomic patient+record registration RPC.

import { describe, test, expect, vi } from "vitest";
import { registerPatientWithRecord, UNREGISTERED_PATIENT_MESSAGE } from "@/lib/services/patientRecordService";

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
      "0001/26",
      recordRow
    );
    expect(result.id).toBe("rec-x");
    expect(result.patient_id).toBe("0001/26");
    expect(fake.rpc).toHaveBeenCalledWith("register_patient_with_record", {
      p_patient: { patient_id: "0001/26" },
      p_record: recordRow,
    });
  });

  test("maps an unregistered patient (23503) to the register-first message", async () => {
    const fake = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { code: "23503", message: "Patient ID is not registered." },
      }),
    };
    await expect(
      registerPatientWithRecord(fake as never, "0001/26", recordRow)
    ).rejects.toThrow(UNREGISTERED_PATIENT_MESSAGE);
  });

  test("passes through other database errors", async () => {
    const fake = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { code: "23503", message: "violates foreign key" },
      }),
    };
    await expect(
      registerPatientWithRecord(fake as never, "0001/26", recordRow)
    ).rejects.toThrow("violates foreign key");
  });

  test("throws when RPC returns no record (nothing committed client-side)", async () => {
    const fake = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    await expect(
      registerPatientWithRecord(fake as never, "0001/26", recordRow)
    ).rejects.toThrow("Failed to save patient record.");
  });
});
