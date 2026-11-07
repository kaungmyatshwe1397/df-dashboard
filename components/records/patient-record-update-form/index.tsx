// GP editing exposes visit fields while Case entry retains its patient-selection workflow.
"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/context/DataContext";
import { RecordCategory } from "@/lib/global";
import { PatientSearch } from "@/components/patients/patientSearch";
import { DuplicateWarning } from "@/components/patients/patientSearch/duplicateWarning";
import { PatientInfoSection } from "./patientInfoSection";
import { MedicalHistory } from "./medicalHistory";
import { CurrentMedicationList } from "./currentMedicationList";
import { RecordDateField } from "./recordDateField";
import { CaseFormFields } from "./CaseFormFields";
import { RecordFormFields } from "./RecordFormFields";
import type { PatientRecordUpdateFormProps } from "./Types";
import { useRecordForm } from "./useRecordForm";
import { VisitPicker } from "./visitPicker";
import { GpRecordFields } from "./gpRecordFields";
import { CaseRecordFields } from "./caseRecordFields";

export function PatientRecordUpdateForm(props: PatientRecordUpdateFormProps) {
  const { open, onOpenChange, isAdding = false, defaultCategory = RecordCategory.GP } = props;
  const state = useRecordForm(props);
  const { medicalHistoryOptions } = useData();
  const { record, patient, isNew, form, errors, saving, loadingPatient } = state;
  const pickingPatient = isAdding && !patient && !isNew;
  const pickingVisit = !isAdding && !record;
  const showDemographics = state.standaloneGp || isNew || (!isAdding && !!patient);
  return <Dialog open={open} onOpenChange={saving ? undefined : onOpenChange}>
    <DialogContent className={state.gpEditing || state.standaloneRecord ? "sm:max-w-4xl" : "sm:max-w-lg"} showCloseButton={!saving}>
      <DialogHeader>
        <DialogTitle>{isAdding ? `Add ${state.isCase ? "Case" : "GP"} Record` : "Edit Patient Record"}</DialogTitle>
        <DialogDescription>{pickingPatient ? "Search for an existing patient or add an unregistered patient."
          : pickingVisit ? "Find and select the visit you want to edit in the selected month."
          : state.gpEditing || state.standaloneRecord ? "Update patient and treatment details for this visit." : "Enter patient and treatment details. Registration is optional."}</DialogDescription>
      </DialogHeader>
      {state.error && <Alert variant="destructive"><AlertDescription>{state.error}</AlertDescription></Alert>}
      {loadingPatient && <p role="status">Loading patient details...</p>}
      {pickingPatient ? <PatientSearch onSelect={state.selectPatient} onCreate={state.createNew} disabled={saving} />
        : pickingVisit ? <VisitPicker category={defaultCategory} onSelect={state.setRecord} />
        : <div className="grid gap-4">
          {state.gpEditing ? <GpRecordFields form={form} errors={errors} saving={saving || loadingPatient}
            demographicsDisabled={!!record?.patient_uuid && !patient} updateField={state.updateField} />
            : state.standaloneRecord ? <CaseRecordFields key={record?.id} form={form} errors={errors} saving={saving} updateField={state.updateField} isEditing /> : <>
          {patient && <div className="grid gap-2">
            <p className="break-words font-medium">{patient.patient_name} / {patient.patient_id ?? "Not assigned"}</p>
            <p className="text-body-sm text-muted-foreground">Age {patient.age} / {patient.gender} / {patient.address || "Address not provided"}</p>
            <Badge variant="secondary">{patient.is_registered ? "Registered" : "Unregistered"}</Badge>
          </div>}
          {isNew && <Badge variant="secondary">New unregistered patient</Badge>}
          {showDemographics && <>
            <PatientInfoSection form={form} errors={errors} saving={saving} idLocked demographicsLocked={false}
              showPatientId={false} showClinicalHistory={!state.standaloneGp} checkingPatient={false} lookupNotice={null} idCheckError={null}
              onPatientIdBlur={() => {}} onPatientIdChange={() => {}} updateField={state.updateField} />
            {!state.standaloneGp && <><MedicalHistory options={medicalHistoryOptions} selected={form.pastMedicalHistory}
              onChange={(next) => state.setForm((previous) => ({ ...previous, pastMedicalHistory: next }))} disabled={saving} />
            <CurrentMedicationList value={form.currentMedications}
              onChange={(next) => state.setForm((previous) => ({ ...previous, currentMedications: next }))} disabled={saving} /></>}
          </>}
          <RecordDateField value={form.recordDate} error={errors.recordDate} saving={saving}
            onChange={(value) => state.updateField("recordDate", value)} />
          {state.isCase ? <CaseFormFields form={{ ...form, category: defaultCategory }} errors={errors}
            remaining={String(Number(form.totalCost) - Number(form.paid))} saving={saving} updateField={state.updateField} isEditing={!isAdding} />
            : <RecordFormFields form={{ ...form, category: defaultCategory }} errors={errors} saving={saving} updateField={state.updateField} />}
          {!isAdding && state.isCase && <p className="text-body-sm text-muted-foreground">Use Record payment to add installments. Paid amounts are read-only here.</p>}
          {state.duplicates && <DuplicateWarning result={state.duplicates} onSelect={state.selectPatient}
            onConfirm={() => state.save(true)} disabled={saving} />}
          </>}
          <DialogFooter>
            {record && <Button variant="destructive" size="sm" className="sm:mr-auto" disabled={saving} onClick={state.remove}>Delete</Button>}
            {isAdding && <Button variant="outline" disabled={saving} onClick={state.changePatient}>Change Patient</Button>}
            {!isAdding && !props.editRecord && <Button variant="outline" disabled={saving} onClick={() => state.setRecord(null)}>Back to visits</Button>}
            {!isAdding && <Button variant="outline" size="sm" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button>}
            <Button size="sm" onClick={() => state.save()} disabled={saving || loadingPatient}>{saving ? "Saving..." : isAdding ? "Add Record" : "Save Changes"}</Button>
          </DialogFooter>
        </div>}
    </DialogContent>
  </Dialog>;
}
