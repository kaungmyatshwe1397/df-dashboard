// Standalone GP acknowledgements must preserve visit demographics without requiring a registry profile.
import { expect, test, vi } from "vitest";
import { savePatientRecord } from "@/lib/services/atomicRecordSaveService";
import { Gender, RecordCategory } from "@/lib/global";
import { EMPTY_PATIENT_FILTERS, matchesRecordFilters } from "@/lib/patient-search";

const details = { patient_name: "Ma Aye", age: 40, gender: Gender.FEMALE, address: "North Village", telephone: "+95 9 123456" };
const record = { ...details, id: "visit", patient_uuid: null, patient_id: null, category: RecordCategory.GP,
  cycle_id: "cycle", entry_date: "2026-09-01", month_label: "Sep 2026", total_cost: 5000, diagnosis: "Checkup" } as const;
const cycle = { id: "cycle", month_year: "2026-09" };

test("saves and maps standalone GP data through its dedicated RPC", async () => {
  const client = { rpc: vi.fn().mockResolvedValue({ data: { record, cycle }, error: null }) };
  const saved = await savePatientRecord(client as never, "submission", { record_patient: details }, record);
  expect(client.rpc).toHaveBeenCalledWith("save_gp_record", { p_submission_id: "submission", p_patient: details, p_record: record });
  expect(saved.record).toMatchObject({ patient_uuid: null, age: 40, gender: Gender.FEMALE, patient_name: "Ma Aye", telephone: "+95 9 123456" });
  expect(saved.patient).toBeUndefined();
  expect(saved.payment).toBeNull();
});

test("rejects an incomplete GP acknowledgement and reports missing migration", async () => {
  const client = { rpc: vi.fn().mockResolvedValue({ data: { cycle }, error: null }) };
  await expect(savePatientRecord(client as never, "submission", { record_patient: details }, record)).rejects.toThrow("Retry with the same values");
  client.rpc.mockResolvedValue({ data: null, error: { code: "PGRST202" } });
  await expect(savePatientRecord(client as never, "submission", { record_patient: details }, record)).rejects.toThrow("database update");
});

test("rejects unsupported categories and GP installments before contacting the database", async () => {
  const client = { rpc: vi.fn() };
  await expect(savePatientRecord(client as never, "submission", { record_patient: details }, { ...record, category: "UNKNOWN" })).rejects.toThrow("Choose GP or Case");
  await expect(savePatientRecord(client as never, "submission", { record_patient: details }, record, 1)).rejects.toThrow("without installments");
  expect(client.rpc).not.toHaveBeenCalled();
});

test("filters unlinked visits by demographics without treating them as unregistered", () => {
  expect(matchesRecordFilters(record, { ...EMPTY_PATIENT_FILTERS, query: "aye", address: "north", age: "40", gender: "FEMALE" })).toBe(true);
  expect(matchesRecordFilters(record, { ...EMPTY_PATIENT_FILTERS, age: "4" })).toBe(false);
  expect(matchesRecordFilters(record, { ...EMPTY_PATIENT_FILTERS, registration: "unregistered" })).toBe(false);
  expect(matchesRecordFilters(record, { ...EMPTY_PATIENT_FILTERS, registration: "registered" })).toBe(false);
});
