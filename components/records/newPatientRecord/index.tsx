// A full-page visit form keeps one retry-safe save per patient while allowing quick consecutive entries.
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useCanEdit } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { usePatients } from "@/context/hooks/usePatients";
import { RecordCategory, type PatientType, type PatientSourceType, type PatientSearchResultType } from "@/lib/global";
import { getEmptyForm, type FormErrors, type FormState } from "@/components/records/patient-record-update-form/Types";
import { getPatientDemographics, validateRecordForm } from "@/components/records/patient-record-update-form/formValidation";
import { PatientInfoSection } from "@/components/records/patient-record-update-form/patientInfoSection";
import { MedicalHistory } from "@/components/records/patient-record-update-form/medicalHistory";
import { CurrentMedicationList } from "@/components/records/patient-record-update-form/currentMedicationList";
import { RecordDateField } from "@/components/records/patient-record-update-form/recordDateField";
import { RecordFormFields } from "@/components/records/patient-record-update-form/RecordFormFields";
import { CaseFormFields } from "@/components/records/patient-record-update-form/CaseFormFields";
import { DuplicateWarning } from "@/components/patients/patientSearch/duplicateWarning";
import { PatientSearch } from "@/components/patients/patientSearch";
import { RecordSaveError } from "@/lib/services/atomicRecordSaveService";
import { PatientIdDialog, type PatientChoiceType } from "./patientIdDialog";
import { NewGpRecord } from "../newGpRecord";

export function NewPatientRecord({ listPath, category }: { listPath: string; category: RecordCategory }) {
  return category === RecordCategory.GP ? <NewGpRecord listPath={listPath} /> : <CasePatientRecord listPath={listPath} category={category} />;
}

function CasePatientRecord({ listPath, category }: { listPath: string; category: RecordCategory }) {
  const router = useRouter();
  const canEdit = useCanEdit();
  const { addRecord, medicalHistoryOptions } = useData();
  const { findPossiblePatients } = usePatients();
  const [choice, setChoice] = useState<PatientChoiceType | null>(null);
  const [idDialogOpen, setIdDialogOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [form, setForm] = useState<FormState>(getEmptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<PatientSearchResultType | null>(null);
  const [saving, setSaving] = useState(false);
  const [submissionStarted, setSubmissionStarted] = useState(false);
  const [idRejected, setIdRejected] = useState(false);
  const submission = useRef<string | undefined>(undefined);
  const pendingAddAnother = useRef(false);
  const isCase = category === RecordCategory.CASE;
  const returnPath = isCase ? `${listPath}?tab=case` : listPath;

  function choosePatient(next: PatientChoiceType) {
    if (submission.current) return;
    setChoice(next); setErrors({}); setError(null); setDuplicates(null); setSearchOpen(false); setIdRejected(false);
    if (next.kind === "existing") {
      const patient = next.patient;
      setForm((previous) => ({ ...previous, patientId: next.patientIdToRegister ?? patient.patient_id ?? "", patientName: patient.patient_name,
        age: String(patient.age), gender: patient.gender, address: patient.address ?? "", drugAllergy: patient.drug_allergy ?? "",
        pastDentalHistory: patient.past_dental_history ?? "", pastMedicalHistory: [...patient.past_medical_history], currentMedications: [...patient.current_medications] }));
    } else {
      setForm((previous) => next.kind === "registered" && choice?.kind === "registered"
        ? { ...previous, patientId: next.patientId }
        : { ...previous, patientId: next.kind === "registered" ? next.patientId : "", patientName: "", age: "",
            gender: getEmptyForm().gender, address: "", drugAllergy: "", pastDentalHistory: "", pastMedicalHistory: [], currentMedications: [] });
    }
  }

  function updateField(field: string, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setDuplicates(null);
  }

  async function save(addAnother: boolean, confirmedSeparatePerson = false) {
    if (!choice || saving) return;
    pendingAddAnother.current = addAnother;
    const nextErrors = validateRecordForm(form, isCase, choice.kind !== "existing");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSaving(true); setError(null);
    try {
      const demographics = getPatientDemographics(form);
      if (choice.kind !== "existing" && !confirmedSeparatePerson && !submission.current) {
        const possible = await findPossiblePatients(demographics);
        if (possible.total) { setDuplicates(possible); return; }
      }
      const patientSource: PatientSourceType = choice.kind === "existing"
        ? { existing_patient_uuid: choice.patient.id, register_existing: !!(choice.patient.patient_id || choice.patientIdToRegister),
            register_patient_id: choice.patientIdToRegister }
        : { new_patient: { ...demographics, patient_id: choice.kind === "registered" ? choice.patientId : undefined } };
      submission.current ??= crypto.randomUUID();
      setSubmissionStarted(true);
      const treatment = { entry_date: form.recordDate, category,
        diagnosis: isCase ? form.caseType + (form.teeth ? ` at ${form.teeth}` : "") : form.diagnosis.trim(),
        total_cost: Number(form.totalCost), case_type: isCase ? form.caseType : undefined,
        teeth: isCase ? form.teeth || undefined : undefined, lab_name: isCase ? form.labName : undefined,
        lab_send_date: form.labSendDate || undefined, delivery_date: form.deliveryDate || undefined };
      await addRecord(treatment, patientSource, isCase ? Number(form.paid) : 0, submission.current);
      if (addAnother) {
        setForm({ ...getEmptyForm(), recordDate: form.recordDate });
        setChoice(null); setErrors({}); setDuplicates(null); submission.current = undefined; setSubmissionStarted(false);
        setIdDialogOpen(true);
      } else router.push(returnPath);
    } catch (err) {
      if (err instanceof RecordSaveError && err.code === "23505") {
        // A unique-ID rejection rolls back the transaction, so this attempt cannot have created a visit.
        submission.current = undefined; setSubmissionStarted(false); setIdRejected(true);
        setError("This clinic ID was assigned to another patient. Recheck the ID or find the existing patient, then save again.");
      } else setError(err instanceof Error ? err.message : "Could not save the record. Retry with the same values.");
    }
    finally { setSaving(false); }
  }

  function selectExistingPatient(patient: PatientType) {
    choosePatient({ kind: "existing", patient,
      patientIdToRegister: choice?.kind === "registered" && !idRejected && !patient.patient_id ? choice.patientId : undefined });
  }

  return <div className="grid gap-6">
    <div><Button variant="ghost" size="sm" onClick={() => router.push(returnPath)} disabled={saving}><ArrowLeft className="size-4" />Back to records</Button>
      <h1 className="mt-4 text-h1 font-bold">Add {isCase ? "Case" : "GP"} Record</h1><p className="text-body-sm text-muted-foreground">Enter patient and treatment details, then save this visit.</p></div>
    {!canEdit ? <Alert variant="destructive"><AlertDescription>You do not have permission to add records.</AlertDescription></Alert> : <>
      <Card><CardHeader><CardTitle>Patient</CardTitle></CardHeader><CardContent className="grid gap-4">
        <div className="flex flex-wrap items-center gap-3"><Button variant="outline" size="sm" onClick={() => setIdDialogOpen(true)} disabled={saving || submissionStarted}>Patient ID</Button>
          <Button variant="outline" size="sm" onClick={() => setSearchOpen((current) => !current)} disabled={saving || submissionStarted}>Find existing patient</Button>
          {choice && <Badge variant="secondary">{choice.kind === "existing" ? `${choice.patientIdToRegister ?? choice.patient.patient_id ?? "Not assigned"} · ${choice.patient.patient_name}` : choice.kind === "registered" ? `${choice.patientId} · New registered patient` : "New unregistered patient"}</Badge>}
          {!choice && <p className="text-body-sm text-muted-foreground">Check a clinic ID or choose an unregistered patient to begin.</p>}
        </div>
        {choice && <>
          <PatientInfoSection form={form} errors={errors} saving={saving} idLocked demographicsLocked={choice.kind === "existing"} showPatientId={false} checkingPatient={false} lookupNotice={null} idCheckError={null} onPatientIdBlur={() => {}} onPatientIdChange={() => {}} updateField={updateField} />
          <MedicalHistory options={medicalHistoryOptions} selected={form.pastMedicalHistory} onChange={(next) => setForm((previous) => ({ ...previous, pastMedicalHistory: next }))} disabled={saving || choice.kind === "existing"} />
          <CurrentMedicationList value={form.currentMedications} onChange={(next) => setForm((previous) => ({ ...previous, currentMedications: next }))} disabled={saving || choice.kind === "existing"} />
        </>}
      </CardContent></Card>
      {searchOpen && <Card><CardHeader><CardTitle>Find existing patient</CardTitle></CardHeader><CardContent>
        <PatientSearch onSelect={selectExistingPatient} disabled={saving || submissionStarted} />
      </CardContent></Card>}
      {choice && <Card><CardHeader><CardTitle>Visit details</CardTitle></CardHeader><CardContent className="grid gap-4">
        <RecordDateField value={form.recordDate} error={errors.recordDate} saving={saving} onChange={(value) => updateField("recordDate", value)} />
        {isCase ? <CaseFormFields form={{ ...form, category }} errors={errors}
          remaining={String(Number(form.totalCost) - Number(form.paid))} saving={saving} updateField={updateField} />
          : <RecordFormFields form={{ ...form, category }} errors={errors} saving={saving} updateField={updateField} />}
      </CardContent></Card>}
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {duplicates && <DuplicateWarning result={duplicates} onSelect={selectExistingPatient} onConfirm={() => save(pendingAddAnother.current, true)} disabled={saving} />}
      {choice && <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" size="sm" onClick={() => save(true)} disabled={saving}><Plus className="size-4" />Save & add another</Button><Button size="sm" onClick={() => save(false)} disabled={saving}>{saving ? "Saving..." : "Save & back"}</Button></div>}
    </>}
    <PatientIdDialog open={idDialogOpen} onOpenChange={setIdDialogOpen} onChoose={choosePatient} />
  </div>;
}
