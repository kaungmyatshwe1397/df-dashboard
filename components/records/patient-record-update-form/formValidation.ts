// The same visit validations apply whether or not the patient has a clinic ID.
import type { FormErrors, FormState } from "./Types";
import { getRecordDateError } from "@/lib/record-date";
import { Gender, type NewPatientPayloadType } from "@/lib/global";

export function getPatientDemographics(form: FormState): NewPatientPayloadType {
  return {
    patient_name: form.patientName.trim(), age: Number(form.age), gender: form.gender as Gender,
    address: form.address.trim() || undefined, drug_allergy: form.drugAllergy.trim() || undefined,
    past_dental_history: form.pastDentalHistory.trim() || undefined,
    current_medications: form.currentMedications, past_medical_history: form.pastMedicalHistory,
  };
}

export function validateRecordForm(form: FormState, isCase: boolean, validateDemographics: boolean): FormErrors {
  const errors: FormErrors = {};
  const dateError = getRecordDateError(form.recordDate);
  if (dateError) errors.recordDate = dateError;
  if (validateDemographics) {
    if (!form.patientName.trim()) errors.patientName = "Patient name is required.";
    if (!form.age || !Number.isInteger(Number(form.age)) || Number(form.age) < 0 || Number(form.age) > 120) {
      errors.age = "Enter a valid age (0-120).";
    }
    if (!Object.values(Gender).includes(form.gender as Gender)) errors.gender = "Select a gender.";
  }
  if (isCase) {
    if (!form.caseType.trim()) errors.caseType = "Case type is required.";
    if (!form.labName.trim()) errors.labName = "Lab name is required.";
  } else if (!form.diagnosis.trim()) errors.diagnosis = "Diagnosis is required.";
  const cost = Number(form.totalCost);
  if (!form.totalCost || !Number.isFinite(cost) || cost <= 0 || !Number.isInteger(cost)) errors.totalCost = "Enter a whole-number cost greater than 0.";
  if (isCase) {
    const paid = Number(form.paid);
    if (form.paid === "" || !Number.isInteger(paid) || paid < 0) errors.paid = "Enter a whole-number paid amount (0 or more).";
    else if (paid > cost) errors.paid = "Paid amount cannot exceed total cost.";
  }
  return errors;
}
