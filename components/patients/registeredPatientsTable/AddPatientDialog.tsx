// Shared demographics support direct registration, profile editing, and promotion of an existing patient.
"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PatientInfoSection } from "@/components/records/patient-record-update-form/patientInfoSection";
import { MedicalHistory } from "@/components/records/patient-record-update-form/medicalHistory";
import { CurrentMedicationList } from "@/components/records/patient-record-update-form/currentMedicationList";
import { DuplicateWarning } from "@/components/patients/patientSearch/duplicateWarning";
import { useData } from "@/context/DataContext";
import { usePatientProfileForm, type PatientProfileFormPropsType } from "./usePatientProfileForm";

export function AddPatientDialog(props: PatientProfileFormPropsType) {
  const state = usePatientProfileForm(props);
  const { form, errors, saving } = state;
  const { medicalHistoryOptions } = useData();
  return <Dialog open={props.open} onOpenChange={saving ? undefined : props.onOpenChange}>
    <DialogContent className="sm:max-w-lg" showCloseButton={!saving}>
      <DialogHeader>
        <DialogTitle>{state.registering ? state.profile ? "Register Existing Patient" : "Register New Patient" : "Edit Patient"}</DialogTitle>
        <DialogDescription>{state.registering ? "Assign a clinic ID without creating a new visit. Existing patient history is preserved."
          : "Update patient details. Registration is managed separately."}</DialogDescription>
      </DialogHeader>
      {state.error && <Alert variant="destructive"><AlertDescription>{state.error}</AlertDescription></Alert>}
      {state.profile && <p className="text-body-sm">Selected profile: {state.profile.patient_name}</p>}
      <div className="grid gap-4">
        <PatientInfoSection form={form} errors={errors} saving={saving} idLocked={state.idLocked} demographicsLocked={false}
          showPatientId={state.registering || !!state.profile?.patient_id} checkingPatient={false} lookupNotice={null} idCheckError={null}
          onPatientIdBlur={state.checkClinicId} onPatientIdChange={state.changeClinicId} updateField={state.updateField} />
        <MedicalHistory options={medicalHistoryOptions} selected={form.pastMedicalHistory}
          onChange={(next) => state.setForm((previous) => ({ ...previous, pastMedicalHistory: next }))} disabled={saving} />
        <CurrentMedicationList value={form.currentMedications}
          onChange={(next) => state.setForm((previous) => ({ ...previous, currentMedications: next }))} disabled={saving} />
        {state.duplicates && <DuplicateWarning result={state.duplicates} onSelect={state.selectExisting}
          onConfirm={() => state.save(true)} disabled={saving} />}
      </div>
      <DialogFooter><Button onClick={() => state.save()} disabled={saving}>{saving ? "Saving..." : state.registering ? "Register Patient" : "Save Changes"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
