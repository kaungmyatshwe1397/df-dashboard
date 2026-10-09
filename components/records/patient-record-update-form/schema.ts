// Input formats for PatientRecordUpdateForm:
// Patient ID — NNNN/YY (e.g. 0001/26). NNNN is 0001-9999 (four digits,
// never 0000); YY is a two-digit year. Add-form IDs must use the current
// year; lookup accepts any year so records from previous years stay
// searchable.
// Age — digits only, capped at two characters (no sign, no decimal).

const PATIENT_ID_PATTERN = /^(\d{4})\/(\d{2})$/;

export const PATIENT_ID_FORMAT_ERROR =
  "Patient ID must be 4 digits (0001-9999) followed by / and the year (e.g. 0001/26).";

export const PATIENT_ID_YEAR_ERROR =
  "Patient ID year must match the current year (e.g. 0001/26).";

export function currentYearSuffix(): string {
  return String(new Date().getFullYear()).slice(-2);
}

// Keeps only digits, caps at 4 digits + 2-digit year, and inserts "/"
// after the fourth digit. Letters, symbols, and the slash itself are
// re-derived on every keystroke, so invalid characters never land in state.
export function filterPatientIdInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 6);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}/${digits.slice(4)}`;
}

// Shape check for lookup: any two-digit year is allowed.
export function isPatientIdShapeValid(value: string): boolean {
  const match = PATIENT_ID_PATTERN.exec(value);
  if (!match) return false;
  return match[1] !== "0000";
}

// Full check for new registrations: valid shape and the current year.
export function isCurrentYearPatientIdValid(value: string): boolean {
  if (!isPatientIdShapeValid(value)) return false;
  return PATIENT_ID_PATTERN.exec(value)![2] === currentYearSuffix();
}

// Digits only, max two characters — blocks "-", ".", and letters at the
// source so an out-of-range value never reaches validation.
export function filterAgeInput(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 2);
}
