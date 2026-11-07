// A submission identity spans failed saves so retries cannot create another person or receipt.
import { useEffect, useRef, useState } from "react";
import { useData } from "@/context/DataContext";
import { usePatients } from "@/context/hooks/usePatients";
import { RecordCategory, type PatientRecord, type PatientType, type PatientSearchResultType } from "@/lib/global";
import { getEmptyForm, getInitialForm, type FormState, type FormErrors, type PatientRecordUpdateFormProps } from "./Types";
import { getPatientDemographics, validateRecordForm } from "./formValidation";

export function useRecordForm({ open, onOpenChange, defaultCategory = RecordCategory.GP, editRecord, isAdding }: PatientRecordUpdateFormProps) {
  const { addRecord, updateRecord, deleteRecord, updatePatient, refreshData } = useData();
  const { findPatientByUuid, findPossiblePatients } = usePatients();
  const [record, setRecord] = useState<PatientRecord | null>(editRecord ?? null);
  const [patient, setPatient] = useState<PatientType | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<FormState>(getEmptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [duplicates, setDuplicates] = useState<PatientSearchResultType | null>(null);
  const submission = useRef<string | undefined>(undefined);
  const isCase = defaultCategory === RecordCategory.CASE;
  const standaloneGp = !!record && record.category === RecordCategory.GP && !record.patient_uuid;
  const gpEditing = !isAdding && !!record && record.category === RecordCategory.GP;

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;
    setRecord(editRecord ?? null); setPatient(null); setIsNew(false); setErrors({});
    setForm(editRecord ? getInitialForm(editRecord, null) : getEmptyForm());
    setError(null); setDuplicates(null); setLoadingPatient(false); submission.current = undefined;
  }, [open, editRecord, defaultCategory, isAdding]);
  useEffect(() => {
    if (!open || !record) { setLoadingPatient(false); return; }
    let cancelled = false;
    setPatient(null); setForm(getInitialForm(record, null));
    if (!record.patient_uuid) { setLoadingPatient(false); return; }
    setLoadingPatient(true);
    findPatientByUuid(record.patient_uuid).then((profile) => {
      if (!cancelled) {
        if (!profile) { setError("Patient profile is unavailable. You can still update treatment details."); return; }
        setPatient(profile); setForm(getInitialForm(record, profile));
      }
    }).catch(() => { if (!cancelled) setError("Could not load patient details. Treatment details can still be edited."); })
      .finally(() => { if (!cancelled) setLoadingPatient(false); });
    return () => { cancelled = true; };
  }, [open, record, findPatientByUuid]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function selectPatient(next: PatientType) {
    setPatient(next); setIsNew(false); setDuplicates(null); setError(null); setErrors({});
    setForm((previous) => ({ ...previous, patientId: next.patient_id ?? "", patientName: next.patient_name,
      age: String(next.age), gender: next.gender, address: next.address ?? "", drugAllergy: next.drug_allergy ?? "",
      pastDentalHistory: next.past_dental_history ?? "", pastMedicalHistory: [...next.past_medical_history], currentMedications: [...next.current_medications] }));
  }
  function updateField(field: string, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined })); setDuplicates(null);
  }
  async function save(confirmedSeparatePerson = false) {
    const nextErrors = validateRecordForm(form, isCase, standaloneGp || isNew || (!isAdding && !!patient));
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || (isAdding && !patient && !isNew)) return;
    setSaving(true); setError(null);
    try {
      const demographics = getPatientDemographics(form);
      if (isAdding && isNew && !confirmedSeparatePerson && !submission.current) {
        const possible = await findPossiblePatients(demographics);
        if (possible.total) { setDuplicates(possible); return; }
      }
      const treatment = { entry_date: form.recordDate, category: defaultCategory, total_cost: Number(form.totalCost),
        diagnosis: isCase ? form.caseType + (form.teeth ? ` at ${form.teeth}` : "") : form.diagnosis.trim(),
        case_type: isCase ? form.caseType : undefined, teeth: isCase ? form.teeth || undefined : undefined,
        lab_name: isCase ? form.labName : undefined, lab_send_date: form.labSendDate || undefined, delivery_date: form.deliveryDate || undefined };
      if (isAdding) {
        submission.current ??= crypto.randomUUID();
        await addRecord(treatment, patient ? { existing_patient_uuid: patient.id } : { new_patient: demographics },
          isCase ? Number(form.paid) : 0, submission.current);
      } else if (record) {
        if (patient) await updatePatient(patient.id, gpEditing
          ? { patient_name: demographics.patient_name, age: demographics.age, gender: demographics.gender, address: demographics.address ?? null }
          : { ...demographics, address: demographics.address ?? null,
            drug_allergy: demographics.drug_allergy ?? null, past_dental_history: demographics.past_dental_history ?? null });
        // Installment totals are owned by payment operations, never overwritten by an edit.
        const recordUpdates = gpEditing ? { ...treatment, telephone: form.telephone.trim() || "" } : treatment;
        await updateRecord(record.id, standaloneGp ? { ...recordUpdates, patient_name: demographics.patient_name,
          age: demographics.age, gender: demographics.gender, address: demographics.address ?? "" } : recordUpdates);
      }
      refreshData(); onOpenChange(false);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save the record. Retry with the same values."); }
    finally { setSaving(false); }
  }
  async function remove() {
    if (!record) return;
    setSaving(true); setError(null);
    try { await deleteRecord(record.id); onOpenChange(false); }
    catch { setError("Could not delete the record. Please retry."); }
    finally { setSaving(false); }
  }
  function changePatient() { setPatient(null); setIsNew(false); setDuplicates(null); setErrors({}); setError(null); }
  function selectVisit(next: PatientRecord | null) {
    setRecord(next); setPatient(null); setForm(next ? getInitialForm(next, null) : getEmptyForm());
    setLoadingPatient(!!next); setError(null); setErrors({});
  }
  function createNew() {
    setPatient(null); setIsNew(true); setDuplicates(null);
    const blank = getEmptyForm();
    setForm((previous) => ({ ...previous, patientId: "", patientName: "", age: "", gender: blank.gender,
      address: "", drugAllergy: "", pastDentalHistory: "", pastMedicalHistory: [], currentMedications: [] }));
  }
  return { record, setRecord: selectVisit, patient, isNew, form, setForm, errors, error, saving, loadingPatient,
    duplicates, isCase, standaloneGp, gpEditing, selectPatient, updateField, save, remove, changePatient, createNew };
}
