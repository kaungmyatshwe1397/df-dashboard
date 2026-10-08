// Patient Record Update Form
// Record entry requires a patient already present in the registry.
// Add mode verifies the Patient ID before showing GP or Case fields.

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlignCenter, Loader2, Search, Trash2 } from "lucide-react";
import { useData } from "@/context/DataContext";
import { FormField } from "@/components/shared/formField";
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
import {
  filterPatientIdInput,
  isPatientIdShapeValid,
  isCurrentYearPatientIdValid,
  PATIENT_ID_FORMAT_ERROR,
  PATIENT_ID_YEAR_ERROR,
} from "./schema";

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
  // Both GP and Case add flows verify a registered patient first, then show
  // only the record fields — the registry row supplies all demographics.
  const needsVerifiedPatient = isAdding;
  const [gpLookupId, setGpLookupId] = useState("");
  const [gpLookupError, setGpLookupError] = useState<string | null>(null);
  const [gpNotFound, setGpNotFound] = useState(false);
  const pathname = usePathname();
  const registerPatientsPath = pathname?.startsWith("/assistant")
    ? "/assistant/register-patients"
    : "/admin/register-patients";

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
    setGpLookupId("");
    setGpLookupError(null);
    setGpNotFound(false);

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
    const trimmedId = lookupId.trim();
    if (!trimmedId) {
      setLookupError("Enter a Patient ID to search.");
      return;
    }
    // Any two-digit year is valid here so older records stay findable.
    if (!isPatientIdShapeValid(trimmedId)) {
      setLookupError(PATIENT_ID_FORMAT_ERROR);
      return;
    }
    setCheckingPatient(true);
    try {
      const record = findRecordByPatientId(trimmedId, defaultCategory);
      if (!record) {
        setLookupError(
          `No ${isCase ? "case" : "GP"} patient found with ID "${trimmedId}".`
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
    setGpLookupId("");
    setGpLookupError(null);
    setGpNotFound(false);
  }

  // Fresh add dialog on every open — the ID check comes first each time.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open || !isAdding) return;
    setReturningPatient(null);
    setGpLookupId("");
    setGpLookupError(null);
    setGpNotFound(false);
    setForm(getEmptyForm());
    setErrors({});
    setSubmitError(null);
  }, [open, isAdding]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Add flows: verify the ID against the registry before showing the form.
  async function handleGpLookup() {
    const trimmedId = gpLookupId.trim();
    if (!trimmedId) {
      setGpLookupError("Enter a Patient ID to search.");
      return;
    }
    if (!isPatientIdShapeValid(trimmedId)) {
      setGpLookupError(PATIENT_ID_FORMAT_ERROR);
      return;
    }

    setCheckingPatient(true);
    setGpLookupError(null);
    try {
      const patient = await findPatientById(trimmedId);
      if (!patient) {
        setGpNotFound(true);
        setReturningPatient(null);
        return;
      }
      setGpNotFound(false);
      setReturningPatient(patient);
      setForm({
        ...getEmptyForm(),
        patientId: patient.patient_id,
        patientName: patient.patient_name,
        age: String(patient.age),
        gender: patient.gender,
        address: patient.address ?? "",
        drugAllergy: patient.drug_allergy ?? "",
        pastDentalHistory: patient.past_dental_history ?? "",
        pastMedicalHistory: [...patient.past_medical_history],
        currentMedications: [...patient.current_medications],
      });
      setErrors({});
    } catch {
      setGpLookupError(
        "Could not verify Patient ID. Check your connection and try again."
      );
    } finally {
      setCheckingPatient(false);
    }
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
  // Value is filtered to digits + auto-inserted "/" so only NNNN/YY can form.
  function handlePatientIdChange(value: string) {
    const nextId = filterPatientIdInput(value);
    updateField("patientId", nextId);
    if (returningPatient && nextId.trim() !== returningPatient.patient_id) {
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
    // Malformed IDs never reach the registry — format errors are shown on save.
    if (!isPatientIdShapeValid(id)) return;
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
    } else if (isAdding && !returningPatient) {
      // Only new registrations are format-checked; edit mode and returning
      // patients keep their pre-existing IDs (possibly an older year).
      const id = form.patientId.trim();
      if (!isPatientIdShapeValid(id)) {
        newErrors.patientId = PATIENT_ID_FORMAT_ERROR;
      } else if (!isCurrentYearPatientIdValid(id)) {
        newErrors.patientId = PATIENT_ID_YEAR_ERROR;
      }
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
        if (!returningPatient) {
          throw new Error("Register the patient before adding a record.");
        }

        const recordData = {
          patient_id: returningPatient.patient_id,
          patient_name: returningPatient.patient_name,
          address: returningPatient.address,
          ...treatment,
        };

        await addRecord(
          recordData,
          returningPatient.patient_id,
          isCase ? paidAmount : undefined
        );
      } else if (foundRecord) {
        // Without a loaded registry row the form holds record-only prefill;
        // writing it back would overwrite real demographics (or miss the row).
        if (registryRowLoaded) {
          await updatePatient(foundRecord.patient_id, buildDemographics());
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
          <DialogDescription >
            {isAdding && !returningPatient
              ? "Enter a registered Patient ID to add a record."
              : isLookupMode && !foundRecord
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

        {/* Add mode — verify a registered patient before the record form */}
        {needsVerifiedPatient && !returningPatient ? (
          <div>
            <div className="grid gap-3">
              <Label htmlFor="gpLookupId">Patient ID</Label>
              <div className="flex gap-2">
                <Input
                  id="gpLookupId"
                  placeholder="e.g. 0001/26"
                  inputMode="numeric"
                  value={gpLookupId}
                  onChange={(e) => {
                    setGpLookupId(filterPatientIdInput(e.target.value));
                    setGpLookupError(null);
                    setGpNotFound(false);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleGpLookup()}
                  disabled={saving || checkingPatient}
                />
                <Button
                  onClick={handleGpLookup}
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
              {gpLookupError && (
                <p className="text-caption text-destructive">{gpLookupError}</p>
              )}
              {gpNotFound && (
                <>
                  <Alert>
                    <AlertDescription>
                      No registered patient found for ID
                      {` “${gpLookupId.trim()}”.`} Please register this patient
                      first, then add the record.
                    </AlertDescription>
                  </Alert>
                  <Link
                    href={registerPatientsPath}
                    onClick={() => onOpenChange(false)}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Go to Register Patients
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : isLookupMode && !foundRecord ? (
          <div>
            <div className="grid gap-3">
              <Label htmlFor="lookupId">
                Patient ID 
              </Label>
              <div className="flex gap-2">
                <Input
                  id="lookupId"
                  placeholder="e.g. 0001/26"
                  inputMode="numeric"
                  value={lookupId}
                  onChange={(e) => {
                    setLookupId(filterPatientIdInput(e.target.value));
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
            <ScrollArea className="max-h-[60vh] px-3.5">
              <div className="grid gap-4 py-2">
              {isAdding && returningPatient ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Patient ID" htmlFor="add-patientId" required>
                      <Input
                        id="add-patientId"
                        value={form.patientId}
                        disabled
                      />
                    </FormField>
                    <FormField label="Patient Name" htmlFor="add-patientName" required>
                      <Input
                        id="add-patientName"
                        value={form.patientName}
                        disabled
                      />
                    </FormField>
                  </div>

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
                </>
              ) : (
                <>
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
                </>
              )}
              </div>
            </ScrollArea>

            <DialogFooter className="py-1.5 px-3.5">
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
              {isAdding && returningPatient && (
                <Button variant="outline" onClick={handleReset} disabled={saving}>
                  Change Patient
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
