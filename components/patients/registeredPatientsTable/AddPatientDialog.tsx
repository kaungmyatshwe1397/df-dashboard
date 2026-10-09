// AddPatientDialog — registers a new patient directly in the registry,
// without creating a visit record. Mirrors the Patient Record form's
// dialog styling (PatientInfoSection + ScrollArea body + footer actions).

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { PatientInfoSection } from "@/components/records/patient-record-update-form/patientInfoSection";
import { MedicalHistory } from "@/components/records/patient-record-update-form/medicalHistory";
import { CurrentMedicationList } from "@/components/records/patient-record-update-form/currentMedicationList";
import {
  filterPatientIdInput,
  isCurrentYearPatientIdValid,
  PATIENT_ID_FORMAT_ERROR,
} from "@/components/records/patient-record-update-form/schema";
import {
  FormState,
  FormErrors,
  getEmptyForm,
} from "@/components/records/patient-record-update-form/Types";
import { usePatients } from "@/context/hooks/usePatients";
import { createClient } from "@/lib/supabase/client";
import { toMedicalHistoryOptions } from "@/lib/data-helpers";
import { Gender, MedicalHistoryOptionType, PatientPayloadType } from "@/lib/global";

interface AddPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function AddPatientDialog({
  open,
  onOpenChange,
  onCreated,
}: AddPatientDialogProps) {
  const { findPatientById, createPatient } = usePatients();
  const [medicalHistoryOptions, setMedicalHistoryOptions] = useState<
    MedicalHistoryOptionType[]
  >([]);

  const [form, setForm] = useState<FormState>(getEmptyForm());
  const [errors, setErrors] = useState<FormErrors>({});
  const [checkingPatient, setCheckingPatient] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset to a blank form whenever the dialog is reopened.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      setForm(getEmptyForm());
      setErrors({});
      setSubmitError(null);
      setCheckingPatient(false);
    }
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // PMH options load when the dialog opens (same source the record form uses).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function loadOptions() {
      const supabase = createClient();
      const { data } = await supabase
        .from("medical_history_options")
        .select("*")
        .order("name");
      if (!cancelled) {
        setMedicalHistoryOptions(toMedicalHistoryOptions(data ?? []));
      }
    }

    loadOptions();
    return () => {
      cancelled = true;
    };
  }, [open]);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handlePatientIdChange(value: string) {
    setForm((prev) => ({
      ...prev,
      patientId: filterPatientIdInput(value),
    }));
    setErrors((prev) => ({ ...prev, patientId: undefined }));
  }

  // Same blur-time check as the record form: a taken ID blocks registration.
  async function handlePatientIdBlur() {
    const id = form.patientId.trim();
    if (!isCurrentYearPatientIdValid(id)) return;

    setCheckingPatient(true);
    try {
      const existing = await findPatientById(id);
      if (existing) {
        setErrors((prev) => ({
          ...prev,
          patientId: `Patient ID ${id} is already registered to ${existing.patient_name}.`,
        }));
      }
    } catch {
      // Lookup failures surface at submit; don't block typing on blur errors.
    } finally {
      setCheckingPatient(false);
    }
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!isCurrentYearPatientIdValid(form.patientId.trim())) {
      newErrors.patientId = PATIENT_ID_FORMAT_ERROR;
    }
    if (!form.patientName.trim()) {
      newErrors.patientName = "Patient name is required.";
    }
    const parsedAge = Number(form.age);
    if (!form.age || isNaN(parsedAge) || parsedAge < 0 || parsedAge > 120) {
      newErrors.age = "Enter a valid age (0-120).";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;

    setSaving(true);
    setSubmitError(null);

    const patient: PatientPayloadType = {
      patient_id: form.patientId.trim(),
      patient_name: form.patientName.trim(),
      age: Number(form.age),
      gender: form.gender as Gender,
      address: form.address.trim() || undefined,
      drug_allergy: form.drugAllergy.trim() || undefined,
      past_dental_history: form.pastDentalHistory.trim() || undefined,
      current_medications: form.currentMedications,
      past_medical_history: form.pastMedicalHistory,
    };

    try {
      await createPatient(patient);
      onOpenChange(false);
      onCreated();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to register patient."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={saving ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton={!saving}>
        <DialogHeader>
          <DialogTitle>Register New Patient</DialogTitle>
          <DialogDescription>
            Fill in the patient details. A visit record can be added later
            from Records.
          </DialogDescription>
        </DialogHeader>

        {submitError && (
          <Alert variant="destructive">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <ScrollArea className="max-h-[60vh] px-3.5">
          <div className="grid gap-4 py-2">
            <PatientInfoSection
              form={form}
              errors={errors}
              saving={saving}
              idLocked={false}
              demographicsLocked={false}
              checkingPatient={checkingPatient}
              lookupNotice={null}
              idCheckError={null}
              onPatientIdBlur={handlePatientIdBlur}
              onPatientIdChange={handlePatientIdChange}
              updateField={updateField}
            />

            <MedicalHistory
              options={medicalHistoryOptions}
              selected={form.pastMedicalHistory}
              onChange={(next) =>
                setForm((prev) => ({ ...prev, pastMedicalHistory: next }))
              }
              disabled={saving}
            />

            <CurrentMedicationList
              value={form.currentMedications}
              onChange={(next) =>
                setForm((prev) => ({ ...prev, currentMedications: next }))
              }
              disabled={saving}
            />
          </div>
        </ScrollArea>

        <DialogFooter className="py-1.5 px-3.5">
          <Button onClick={handleSave} disabled={saving || checkingPatient}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Register Patient"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
