// Patient Record Update Form
// Lookup (edit-by-ID) → pre-filled edit · Add (new or returning patient).
// Add mode checks the patients registry on Patient-ID blur: an existing ID
// locks all demographics (returning visit — treatment/cost only); a new ID
// leaves the full patient form editable. Save goes through one atomic RPC.

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search, Trash2 } from "lucide-react";
import { useData } from "@/context/DataContext";
import {
  RecordCategory,
  PatientRecord,
  PatientPayloadType,
  PatientType,
  Gender,
} from "@/lib/global";
import { RecordFormFields } from "./RecordFormFields";
import { CaseFormFields } from "./CaseFormFields";
import { PatientInfoSection } from "./patientInfoSection";
import { MedicalHistory } from "./medicalHistory";
import { CurrentMedicationList } from "./currentMedicationList";
import {
  PatientRecordUpdateFormProps,
  FormErrors,
  FormState,
  getEmptyForm,
  getInitialForm,
} from "./Types";

export function PatientRecordUpdateForm({
  open,
  onOpenChange,
  defaultCategory = RecordCategory.GP,
  editRecord = null,
  isAdding = false,
}: PatientRecordUpdateFormProps) {
  const {
    addRecord,
    updateRecord,
    deleteRecord,
    findRecordByPatientId,
    findPatientById,
    updatePatient,
    medicalHistoryOptions,
  } = useData();
  const isCase = defaultCategory === RecordCategory.CASE;

  const isLookupMode = !isAdding && !editRecord;

  const [lookupId, setLookupId] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [foundRecord, setFoundRecord] = useState<PatientRecord | null>(editRecord);

  const [form, setForm] = useState<FormState | null>(() => {
    if (editRecord) return getInitialForm(editRecord, null);
    if (isAdding) return getEmptyForm();
    return null;
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // True only when the patients registry row was fetched for the current
  // record; guards demographic writes when the fetch failed or no row exists.
  const [registryRowLoaded, setRegistryRowLoaded] = useState(false);

  const [returningPatient, setReturningPatient] = useState<PatientType | null>(null);
  const [lookupNotice, setLookupNotice] = useState<string | null>(null);
  const [checkingPatient, setCheckingPatient] = useState(false);
  const [idCheckError, setIdCheckError] = useState<string | null>(null);

  // Sync internal state when mode/category props change (add → edit → lookup).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setLookupId("");
    setLookupError(null);
    setErrors({});
    setSubmitError(null);
    setReturningPatient(null);
    setLookupNotice(null);
    setIdCheckError(null);
    setCheckingPatient(false);
    setRegistryRowLoaded(false);

    if (isAdding) {
      setFoundRecord(null);
      setForm(getEmptyForm());
    } else if (editRecord) {
      setFoundRecord(editRecord);
      setForm(getInitialForm(editRecord, null));

      // Enrich demographics from the registry (async).
      let cancelled = false;
      setCheckingPatient(true);
      findPatientById(editRecord.patient_id)
        .then((patient) => {
          if (!cancelled && patient) {
            setRegistryRowLoaded(true);
            setForm(getInitialForm(editRecord, patient));
          }
        })
        .catch(() => {
          // Registry row unavailable — keep record-only prefill.
        })
        .finally(() => {
          if (!cancelled) setCheckingPatient(false);
        });
      return () => {
        cancelled = true;
      };
    } else {
      setFoundRecord(null);
      setForm(null);
    }
  }, [isAdding, editRecord, defaultCategory, findPatientById]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const totalCost = form ? parseFloat(form.totalCost) || 0 : 0;
  const paid = form ? parseFloat(form.paid) || 0 : 0;
  const remaining = totalCost - paid;

  async function handleLookup() {
    if (!lookupId.trim()) {
      setLookupError("Enter a Patient ID to search.");
      return;
    }
    setCheckingPatient(true);
    try {
      const record = findRecordByPatientId(lookupId, defaultCategory);
      if (!record) {
        setLookupError(
          `No ${isCase ? "case" : "GP"} patient found with ID "${lookupId.trim()}".`
        );
        return;
      }
      const patient = await findPatientById(record.patient_id).catch(() => null);
      setRegistryRowLoaded(patient !== null);
      setLookupError(null);
      setFoundRecord(record);
      setForm(getInitialForm(record, patient));
    } finally {
      setCheckingPatient(false);
    }
  }

  function handleReset() {
    setFoundRecord(null);
    setForm(null);
    setLookupId("");
    setLookupError(null);
    setErrors({});
    setSubmitError(null);
    setReturningPatient(null);
    setLookupNotice(null);
    setIdCheckError(null);
    setRegistryRowLoaded(false);
  }

  function updateField(field: string, value: string) {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field as keyof FormErrors];
      return next;
    });
  }

  function setArrayField(
    field: "pastMedicalHistory" | "currentMedications",
    value: string[]
  ) {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  // Editing the ID after linking unlinks the returning patient and clears
  // identity fields so a different person can be entered from scratch.
  function handlePatientIdChange(value: string) {
    updateField("patientId", value);
    if (returningPatient && value.trim() !== returningPatient.patient_id) {
      setReturningPatient(null);
      setLookupNotice(null);
      setIdCheckError(null);
      setForm((prev) =>
        prev
          ? {
              ...prev,
              patientName: "",
              age: "",
              gender: Gender.MALE,
              address: "",
              drugAllergy: "",
              pastDentalHistory: "",
              pastMedicalHistory: [],
              currentMedications: [],
            }
          : prev
      );
      setErrors({});
    }
  }

  // Registry check on blur: existing ID → lock demographics (returning visit).
  async function handlePatientIdBlur() {
    if (!isAdding || !form || saving) return;
    const id = form.patientId.trim();
    if (!id) return;
    if (returningPatient && returningPatient.patient_id === id) return;

    setCheckingPatient(true);
    setIdCheckError(null);
    setLookupNotice(null);
    try {
      const patient = await findPatientById(id);
      if (!patient) {
        setReturningPatient(null);
        return;
      }
      setReturningPatient(patient);
      setForm((prev) =>
        prev
          ? {
              ...prev,
              patientName: patient.patient_name,
              age: String(patient.age),
              gender: patient.gender,
              address: patient.address ?? "",
              drugAllergy: patient.drug_allergy ?? "",
              pastDentalHistory: patient.past_dental_history ?? "",
              pastMedicalHistory: [...patient.past_medical_history],
              currentMedications: [...patient.current_medications],
            }
          : prev
      );
      setLookupNotice(
        `Patient ID ${patient.patient_id} is already registered to ${patient.patient_name}. If this is a different person, check your Patient ID again.`
      );
      setErrors((prev) => {
        const next = { ...prev };
        delete next.patientName;
        delete next.age;
        return next;
      });
    } catch {
      setIdCheckError(
        "Could not verify Patient ID. Check your connection and try again."
      );
    } finally {
      setCheckingPatient(false);
    }
  }

  function validate(): boolean {
    if (!form) return false;
    const newErrors: FormErrors = {};

    if (!form.patientId.trim()) {
      newErrors.patientId = "Patient ID is required.";
    }
    if (!form.patientName.trim()) {
      newErrors.patientName = "Patient name is required.";
    }
    const age = parseInt(form.age, 10);
    if (!form.age || isNaN(age) || age < 0 || age > 120) {
      newErrors.age = "Enter a valid age (0-120).";
    }

    if (isCase) {
      if (!form.caseType.trim()) {
        newErrors.caseType = "Case type is required.";
      }
      if (!form.teeth.trim()) {
        newErrors.teeth = "Select at least one tooth.";
      }
      if (!form.labName.trim()) {
        newErrors.labName = "Lab name is required.";
      }
    } else {
      if (!form.diagnosis.trim()) {
        newErrors.diagnosis = "Diagnosis is required.";
      }
    }

    const cost = parseFloat(form.totalCost);
    if (!form.totalCost || isNaN(cost) || cost <= 0) {
      newErrors.totalCost = "Enter a valid cost greater than 0.";
    }

    if (isCase) {
      const paidAmount = parseFloat(form.paid);
      if (form.paid === "" || isNaN(paidAmount) || paidAmount < 0) {
        newErrors.paid = "Enter a valid paid amount (0 or more).";
      } else if (!isNaN(cost) && paidAmount > cost) {
        newErrors.paid = "Paid amount cannot exceed total cost.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function buildDemographics(): Omit<PatientPayloadType, "patient_id"> {
    const age = parseInt(form!.age, 10);
    return {
      patient_name: form!.patientName.trim(),
      age,
      gender: form!.gender as Gender,
      address: form!.address.trim() || undefined,
      drug_allergy: form!.drugAllergy.trim() || undefined,
      past_dental_history: form!.pastDentalHistory.trim() || undefined,
      current_medications: form!.currentMedications,
      past_medical_history: form!.pastMedicalHistory,
    };
  }

  async function handleSave() {
    if (!validate() || !form) return;

    setSaving(true);
    setSubmitError(null);

    try {
      const cost = parseFloat(form.totalCost);
      const paidAmount = isCase ? parseFloat(form.paid) || 0 : cost;

      const diagnosis = isCase
        ? form.caseType + (form.teeth ? ` at ${form.teeth}` : "")
        : form.diagnosis.trim();

      const treatment = {
        diagnosis,
        case_type: isCase ? form.caseType.trim() || undefined : undefined,
        teeth: isCase ? form.teeth.trim() || undefined : undefined,
        total_cost: cost,
        lab_name: isCase ? form.labName.trim() : undefined,
        lab_send_date: isCase && form.labSendDate ? form.labSendDate : undefined,
        delivery_date: isCase && form.deliveryDate ? form.deliveryDate : undefined,
        paid: isCase ? paidAmount : undefined,
        remaining: isCase ? cost - paidAmount : undefined,
        category: defaultCategory,
      };

      if (isAdding) {
        const identity = returningPatient
          ? {
              patient_id: returningPatient.patient_id,
              ...buildDemographicsFor(returningPatient),
            }
          : {
              patient_id: form.patientId.trim(),
              ...buildDemographics(),
            };

        const recordData = {
          patient_id: identity.patient_id,
          patient_name: identity.patient_name,
          address: identity.address,
          ...treatment,
        };

        await addRecord(recordData, identity, !returningPatient);
      } else if (foundRecord) {
        // Without a loaded registry row the form holds record-only prefill;
        // writing it back would overwrite real demographics (or miss the row).
        if (registryRowLoaded) {
          await updatePatient(foundRecord.patient_id, {
            ...buildDemographics(),
            address: form.address.trim() || null,
            drug_allergy: form.drugAllergy.trim() || null,
            past_dental_history: form.pastDentalHistory.trim() || null,
          });
        }
        await updateRecord(foundRecord.id, treatment as Partial<PatientRecord>);
      }

      setSaving(false);
      onOpenChange(false);
    } catch (err) {
      setSaving(false);
      setSubmitError(
        err instanceof Error ? err.message : "Failed to save record. Please try again."
      );
    }
  }

  async function handleDelete() {
    if (!foundRecord) return;

    setSaving(true);
    setSubmitError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      deleteRecord(foundRecord.id);
      setSaving(false);
      onOpenChange(false);
      handleReset();
    } catch {
      setSaving(false);
      setSubmitError("Failed to delete record. Please try again.");
    }
  }

  const idLocked = !!returningPatient || (!isAdding && !!foundRecord);
  const demographicsLocked = !!returningPatient;

  return (
    <Dialog open={open} onOpenChange={saving ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton={!saving}>
        <DialogHeader>
          <DialogTitle>
            {isLookupMode && !foundRecord
              ? isCase
                ? "Update Case Record"
                : "Update GP Record"
              : foundRecord
                ? "Edit Patient Record"
                : isCase
                  ? "Add Case Record"
                  : "Add GP Record"}
          </DialogTitle>
          <DialogDescription>
            {isLookupMode && !foundRecord
              ? "Enter the Patient ID to find and edit a record."
              : foundRecord
                ? "Update the patient record details below."
                : "Fill in the details to add a new patient record."}
          </DialogDescription>
        </DialogHeader>

        {submitError && (
          <Alert variant="destructive">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        {/* Lookup step — only when opened from Update/Edit button */}
        {isLookupMode && !foundRecord ? (
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="lookupId">
                Patient ID <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="lookupId"
                  placeholder="e.g. 0001/26"
                  value={lookupId}
                  onChange={(e) => {
                    setLookupId(e.target.value);
                    setLookupError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                  disabled={saving || checkingPatient}
                />
                <Button
                  onClick={handleLookup}
                  size="icon"
                  variant="outline"
                  disabled={checkingPatient}
                >
                  {checkingPatient ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {lookupError && (
                <p className="text-caption text-destructive">{lookupError}</p>
              )}
            </div>
          </div>
        ) : form ? (
          /* Form step — pre-filled with found record or blank for add */
          <>
            <div className="grid gap-4 py-2 max-h-[60vh] overflow-y-auto themed-scrollbar pr-1">
              <PatientInfoSection
                form={form}
                errors={errors}
                saving={saving}
                idLocked={idLocked}
                demographicsLocked={demographicsLocked}
                checkingPatient={checkingPatient}
                lookupNotice={lookupNotice}
                idCheckError={idCheckError}
                onPatientIdBlur={handlePatientIdBlur}
                onPatientIdChange={handlePatientIdChange}
                updateField={updateField}
              />

              <MedicalHistory
                options={medicalHistoryOptions}
                selected={form.pastMedicalHistory}
                onChange={(next) => setArrayField("pastMedicalHistory", next)}
                disabled={saving || demographicsLocked}
              />

              <CurrentMedicationList
                value={form.currentMedications}
                onChange={(next) => setArrayField("currentMedications", next)}
                disabled={saving || demographicsLocked}
              />

              {isCase ? (
                <CaseFormFields
                  form={{ ...form, category: defaultCategory }}
                  errors={errors}
                  remaining={remaining.toString()}
                  saving={saving}
                  updateField={updateField}
                />
              ) : (
                <RecordFormFields
                  form={{ ...form, category: defaultCategory }}
                  errors={errors}
                  saving={saving}
                  updateField={updateField}
                />
              )}
            </div>

            <DialogFooter>
              {foundRecord && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={saving}
                  className="mr-auto"
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete
                </Button>
              )}
              {isLookupMode && (
                <Button variant="outline" onClick={handleReset} disabled={saving}>
                  Back
                </Button>
              )}
              <Button onClick={handleSave} disabled={saving || checkingPatient}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  isAdding ? "Add Record" : "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function buildDemographicsFor(patient: PatientType) {
  return {
    patient_name: patient.patient_name,
    age: patient.age,
    gender: patient.gender,
    address: patient.address,
    drug_allergy: patient.drug_allergy,
    past_dental_history: patient.past_dental_history,
    current_medications: patient.current_medications,
    past_medical_history: patient.past_medical_history,
  };
}
