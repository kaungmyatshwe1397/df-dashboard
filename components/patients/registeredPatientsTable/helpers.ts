// Pure helpers for the Registered Patients table.
// Kept free of React so search and date formatting are unit-testable.

import { PatientType } from "@/lib/global";

// Case-insensitive match on patient ID or name; empty query returns everything.
export function filterPatients(
  patients: PatientType[],
  query: string
): PatientType[] {
  const q = query.trim().toLowerCase();
  if (!q) return patients;
  return patients.filter(
    (p) =>
      p.patient_id.toLowerCase().includes(q) ||
      p.patient_name.toLowerCase().includes(q)
  );
}

// Registration date as d.M.yy (e.g. "26.9.26") per the list design.
export function formatRegisteredDate(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = String(date.getFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
}
