// New patient creation must use the same retry-protected call as treatment and payment writes.
import { describe, expect, test, vi } from "vitest";
import { savePatientRecord } from "@/lib/services/atomicRecordSaveService";

const patient = { id: "patient-uuid", patient_id: null, is_registered: false, patient_name: "Ma Aye", age: 40,
  gender: "FEMALE", current_medications: [], past_medical_history: [] };
const record = { id: "visit", patient_uuid: patient.id, patient_id: null, patient_name: patient.patient_name,
  category: "GP", entry_date: "2026-09-01", total_cost: 5000, diagnosis: "Checkup" };
const cycle = { id: "cycle", month_year: "2026-09" };
describe("unregistered record service", () => {
  test("returns both the permanent profile and its linked visit", async () => {
    const client = { rpc: vi.fn().mockResolvedValue({ data: { patient, record, cycle, payment: null }, error: null }) };
    const source = { new_patient: { patient_name: "Ma Aye", age: 40, gender: "FEMALE", current_medications: [], past_medical_history: [] } };
    const saved = await savePatientRecord(client as never, "submission", source as never, record);
    expect(saved.record.patient_uuid).toBe(patient.id);
    expect(saved.record.patient?.is_registered).toBe(false);
    expect(saved.patient?.patient_id).toBeNull();
    expect(client.rpc).toHaveBeenCalledWith("save_patient_record", { p_submission_id: "submission", p_patient: source, p_record: record, p_initial_payment: 0 });
  });
  test("reuses the supplied submission and selected UUID across retries", async () => {
    const client = { rpc: vi.fn().mockResolvedValue({ data: { patient, record, cycle }, error: null }) };
    for (let retry = 0; retry < 2; retry++) await savePatientRecord(client as never, "same-submission", { existing_patient_uuid: patient.id }, record);
    expect(client.rpc.mock.calls[0]).toEqual(client.rpc.mock.calls[1]);
  });
  test("rejects partial acknowledgements and propagates transaction failures", async () => {
    const client = { rpc: vi.fn().mockResolvedValue({ data: { record, cycle }, error: null }) };
    await expect(savePatientRecord(client as never, "submission", { existing_patient_uuid: patient.id }, record)).rejects.toThrow("Retry with the same values");
    client.rpc.mockResolvedValue({ data: null, error: { message: "Initial receipt rejected" } });
    await expect(savePatientRecord(client as never, "submission", { existing_patient_uuid: patient.id }, record)).rejects.toThrow("Initial receipt rejected");
  });
});
