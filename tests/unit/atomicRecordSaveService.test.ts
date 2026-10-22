// The service must publish a complete transaction result and retain the supplied retry identity.

import { describe, expect, test, vi } from "vitest";
import { saveRegisteredRecord } from "@/lib/services/atomicRecordSaveService";

const record = {
  id: "visit-1", patient_id: "0099/26", patient_name: "Patient", category: "CASE",
  entry_date: "2026-08-07", cycle_id: "cycle-1", month_label: "Aug 2026",
  diagnosis: "Crown", total_cost: 75000, is_carried_forward: false,
};
const payment = { id: "payment-1", record_id: record.id, payment_date: record.entry_date, paid_amount: 20000, payment_status: "COMPLETED" };
const cycle = { id: "cycle-1", month_year: "2026-08" };

describe("atomic record save service", () => {
  test("returns the complete saved visit, payment, and cycle", async () => {
    const client = { rpc: vi.fn().mockResolvedValue({ data: { record, payment, cycle }, error: null }) };
    const saved = await saveRegisteredRecord(client as never, "submission-1", record.patient_id, record, 20000);
    expect(saved.record.id).toBe(record.id);
    expect(saved.payment).toEqual(payment);
    expect(saved.cycle).toEqual(cycle);
    expect(client.rpc).toHaveBeenCalledWith("save_registered_record", {
      p_submission_id: "submission-1", p_patient_id: record.patient_id, p_record: record, p_initial_payment: 20000,
    });
  });
  test("propagates transaction failure without publishing a partial result", async () => {
    const client = { rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "Payment insert failed." } }) };
    await expect(saveRegisteredRecord(client as never, "submission-1", record.patient_id, record, 20000)).rejects.toThrow("Payment insert failed.");
  });
  test("rejects an incomplete acknowledgement so the caller can safely replay", async () => {
    const client = { rpc: vi.fn().mockResolvedValue({ data: { record }, error: null }) };
    await expect(saveRegisteredRecord(client as never, "submission-1", record.patient_id, record)).rejects.toThrow("Retry with the same values");
  });
  test("GP and zero-payment saves accept a null receipt", async () => {
    const client = { rpc: vi.fn().mockResolvedValue({ data: { record: { ...record, category: "GP" }, payment: null, cycle }, error: null }) };
    expect((await saveRegisteredRecord(client as never, "submission-1", record.patient_id, record)).payment).toBeNull();
  });
});
