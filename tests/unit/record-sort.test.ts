// Sorting must use the entire visit list before either record tab divides it into pages.
import { expect, test } from "vitest";
import { sortRecords } from "@/components/records/record-table/recordSort";
import { RecordCategory, type GPPatientRecordType } from "@/lib/global";

const visits: GPPatientRecordType[] = [
  { id: "b", cycle_id: "c", patient_uuid: "p2", patient_id: "0010/26", entry_date: "2026-10-01", patient_name: "Zoe", category: RecordCategory.GP, diagnosis: "Exam", total_cost: 0, month_label: "Oct 2026" },
  { id: "a", cycle_id: "c", patient_uuid: "p1", patient_id: "0002/26", entry_date: "2026-10-20", patient_name: "Amy", category: RecordCategory.GP, diagnosis: "Exam", total_cost: 0, month_label: "Oct 2026" },
  { id: "c", cycle_id: "c", patient_uuid: "p3", patient_id: null, entry_date: "2026-10-10", patient_name: "Moe", category: RecordCategory.GP, diagnosis: "Exam", total_cost: 0, month_label: "Oct 2026" },
];

test("sorts visits by date, numeric clinic ID, and name without changing the source list", () => {
  expect(sortRecords(visits, "date:desc").map((visit) => visit.id)).toEqual(["a", "c", "b"]);
  expect(sortRecords(visits, "id:asc").map((visit) => visit.id)).toEqual(["a", "b", "c"]);
  expect(sortRecords(visits, "name:desc").map((visit) => visit.id)).toEqual(["b", "c", "a"]);
  expect(visits.map((visit) => visit.id)).toEqual(["b", "a", "c"]);
});
