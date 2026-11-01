// Registration promotes an existing UUID rather than duplicating its treatment history.
import { useEffect, useState } from "react";
import { usePatients } from "@/context/hooks/usePatients";
import { useData } from "@/context/DataContext";
import { Gender, type PatientType, type PatientPayloadType, type PatientSearchResultType } from "@/lib/global";
import { getEmptyForm, type FormState, type FormErrors } from "@/components/records/patient-record-update-form/Types";
import { getPatientDemographics } from "@/components/records/patient-record-update-form/formValidation";
import { isCurrentYearPatientIdValid, PATIENT_ID_FORMAT_ERROR, filterPatientIdInput } from "@/components/records/patient-record-update-form/schema";

export interface PatientProfileFormPropsType {
  open: boolean;
  patient: PatientType | null;
  registrationMode?: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function usePatientProfileForm({ open, patient, registrationMode = false, onOpenChange, onCreated }: PatientProfileFormPropsType) {
  const { findPatientById, createPatient, updatePatient, setPatientRegistration, findPossiblePatients } = usePatients();
  const { refreshData } = useData();
  const [form, setForm] = useState<FormState>(getEmptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [duplicates, setDuplicates] = useState<PatientSearchResultType | null>(null);
  const [selectedExisting, setSelectedExisting] = useState<PatientType | null>(null);
  const profile = selectedExisting ?? patient;
  const registering = registrationMode || !patient;
  const idLocked = !!profile?.patient_id;
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;
    setSelectedExisting(null); setError(null); setErrors({}); setDuplicates(null);
    setForm(profileForm(patient));
  }, [open, patient, registrationMode]);
  /* eslint-enable react-hooks/set-state-in-effect */
  function updateField(field: string, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined })); setDuplicates(null);
  }
  function selectExisting(next: PatientType) {
    setSelectedExisting(next); setDuplicates(null); setForm(profileForm(next)); setError(null); setErrors({});
  }
  async function checkClinicId() {
    if (idLocked || !isCurrentYearPatientIdValid(form.patientId.trim())) return;
    try {
      const existing = await findPatientById(form.patientId.trim());
      if (existing && existing.id !== profile?.id) setErrors((previous) => ({ ...previous, patientId: `This clinic ID belongs to ${existing.patient_name}.` }));
    } catch { setError("Could not check the clinic ID. It will be checked again when saving."); }
  }
  async function save(confirmedSeparatePerson = false) {
    const nextErrors: FormErrors = {};
    if (registering && !idLocked && !isCurrentYearPatientIdValid(form.patientId.trim())) nextErrors.patientId = PATIENT_ID_FORMAT_ERROR;
    if (!form.patientName.trim()) nextErrors.patientName = "Patient name is required.";
    if (form.age === "" || !Number.isInteger(Number(form.age)) || Number(form.age) < 0 || Number(form.age) > 120) nextErrors.age = "Enter a valid age (0-120).";
    if (!Object.values(Gender).includes(form.gender as Gender)) nextErrors.gender = "Select a gender.";
    setErrors(nextErrors); if (Object.keys(nextErrors).length) return;
    setSaving(true); setError(null);
    try {
      const demographics = getPatientDemographics(form);
      const updates = { ...demographics, address: demographics.address ?? null, drug_allergy: demographics.drug_allergy ?? null,
        past_dental_history: demographics.past_dental_history ?? null };
      if (!profile && !confirmedSeparatePerson) {
        const possible = await findPossiblePatients(demographics);
        if (possible.total) { setDuplicates(possible); return; }
      }
      if (profile && registering) await setPatientRegistration(profile.id, true, form.patientId, updates);
      else if (profile) await updatePatient(profile.id, updates);
      else await createPatient({ ...demographics, patient_id: form.patientId.trim() } as PatientPayloadType);
      refreshData(); onOpenChange(false); onCreated();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save patient details."); }
    finally { setSaving(false); }
  }
  return { form, setForm, errors, error, saving, duplicates, profile, registering, idLocked, updateField, selectExisting, checkClinicId, save,
    changeClinicId: (value: string) => updateField("patientId", filterPatientIdInput(value)) };
}

function profileForm(patient: PatientType | null): FormState {
  return patient ? { ...getEmptyForm(), patientId: patient.patient_id ?? "", patientName: patient.patient_name,
    age: String(patient.age), gender: patient.gender, address: patient.address ?? "", drugAllergy: patient.drug_allergy ?? "",
    pastDentalHistory: patient.past_dental_history ?? "", currentMedications: [...patient.current_medications], pastMedicalHistory: [...patient.past_medical_history] }
    : getEmptyForm();
}
