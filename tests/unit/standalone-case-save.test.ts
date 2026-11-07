// Case saves must acknowledge the initial receipt together with the standalone record.
import { expect, test, vi } from "vitest";
import { savePatientRecord } from "@/lib/services/atomicRecordSaveService";
import { Gender } from "@/lib/global";

const details = { patient_name: "Case Person", age: 30, gender: Gender.MALE, telephone: "09 123456" };
const record = { id: "case", cycle_id: "cycle", category: "CASE", patient_uuid: null, patient_id: null, ...details,
  diagnosis: "Crown", case_type: "Crown", total_cost: 100000, paid: 25000, remaining: 75000, lab_name: null };
const cycle = { id: "cycle", month_year: "2026-09" };
const payment = { id: "receipt", record_id: "case", paid_amount: 25000 };

test("maps standalone Case demographics, optional lab, and initial receipt", async () => {
  const client = { rpc: vi.fn().mockResolvedValue({ data: { record, cycle, payment }, error: null }) };
  const saved = await savePatientRecord(client as never, "submission", { record_patient: details }, record, 25000);
  expect(client.rpc).toHaveBeenCalledWith("save_case_record", { p_submission_id: "submission", p_patient: details, p_record: record, p_initial_payment: 25000 });
  expect(saved.record).toMatchObject({ patient_uuid: null, telephone: "09 123456", age: 30, gender: Gender.MALE, lab_name: "", remaining: 75000 });
  expect(saved.payment).toEqual(payment);
  expect(saved.patient).toBeUndefined();
});

test("accepts zero payment without a receipt", async () => {
  const client = { rpc: vi.fn().mockResolvedValue({ data: { record: { ...record, paid: 0, remaining: 100000 }, cycle, payment: null }, error: null }) };
  const saved = await savePatientRecord(client as never, "submission", { record_patient: details }, record, 0);
  expect(saved.payment).toBeNull();
});

test("rejects missing or mismatched initial receipts instead of confirming a partial save", async () => {
  const client = { rpc: vi.fn().mockResolvedValue({ data: { record, cycle, payment: null }, error: null }) };
  await expect(savePatientRecord(client as never, "submission", { record_patient: details }, record, 25000)).rejects.toThrow("Retry with the same values");
  client.rpc.mockResolvedValue({ data: { record, cycle, payment: { ...payment, record_id: "other" } }, error: null });
  await expect(savePatientRecord(client as never, "submission", { record_patient: details }, record, 25000)).rejects.toThrow("Retry with the same values");
});
