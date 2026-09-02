// Patient Record Update Form
// Two-step flow: lookup (search by Patient ID) → form (edit pre-filled data).
// Category is determined by which tab the form was opened from — GP and Case
// have different form fields and search scopes to prevent cross-matching.

"use client";

import { useState, useMemo } from "react";
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
import { RecordCategory, PatientRecord } from "@/lib/global";
import { RecordFormFields } from "./RecordFormFields";
import { CaseFormFields } from "./CaseFormFields";

interface PatientRecordUpdateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory?: RecordCategory;
  editRecord?: PatientRecord | null;
}

interface FormErrors {
  patientId?: string;
  patientName?: string;
  diagnosis?: string;
  totalCost?: string;
  paid?: string;
}

function getInitialForm(record: PatientRecord) {
  return {
    patientId: record.patient_id,
    patientName: record.patient_name,
    address: record.address ?? "",
    diagnosis: record.diagnosis,
    totalCost: record.total_cost.toString(),
    labName: record.lab_name ?? "",
    labSendDate: record.lab_send_date ?? "",
    deliveryDate: record.delivery_date ?? "",
    paid: record.paid?.toString() ?? "",
  };
}

export function PatientRecordUpdateForm({
  open,
  onOpenChange,
  defaultCategory = RecordCategory.GP,
  editRecord = null,
}: PatientRecordUpdateFormProps) {
  const { addRecord, updateRecord, deleteRecord, findRecordByPatientId, cycleLocked } = useData();
  const isCase = defaultCategory === RecordCategory.CASE;

  const isLookupMode = !editRecord;

  const formKey = useMemo(
    () => `${open}-${editRecord?.id ?? "new"}-${defaultCategory}`,
    [open, editRecord?.id, defaultCategory]
  );

  const [lookupId, setLookupId] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [foundRecord, setFoundRecord] = useState<PatientRecord | null>(editRecord);

  const [form, setForm] = useState(() =>
    editRecord ? getInitialForm(editRecord) : null
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const totalCost = form ? parseFloat(form.totalCost) || 0 : 0;
  const paid = form ? parseFloat(form.paid) || 0 : 0;
  const remaining = totalCost - paid;

  function handleLookup() {
    if (!lookupId.trim()) {
      setLookupError("Enter a Patient ID to search.");
      return;
    }
    const record = findRecordByPatientId(lookupId, defaultCategory);
    if (!record) {
      setLookupError(
        `No ${isCase ? "case" : "GP"} patient found with ID "${lookupId.trim()}".`
      );
      return;
    }
    setLookupError(null);
    setFoundRecord(record);
    setForm(getInitialForm(record));
  }

  function handleReset() {
    setFoundRecord(null);
    setForm(null);
    setLookupId("");
    setLookupError(null);
    setErrors({});
    setSubmitError(null);
  }

  function updateField(field: string, value: string) {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field as keyof FormErrors];
      return next;
    });
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
    if (!form.diagnosis.trim()) {
      newErrors.diagnosis = "Diagnosis is required.";
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

  async function handleSave() {
    if (!validate() || !form || !foundRecord) return;

    setSaving(true);
    setSubmitError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const cost = parseFloat(form.totalCost);
      const paidAmount = isCase ? parseFloat(form.paid) || 0 : cost;

      updateRecord(foundRecord.id, {
        patient_id: form.patientId.trim(),
        patient_name: form.patientName.trim(),
        address: form.address.trim() || undefined,
        diagnosis: form.diagnosis.trim(),
        total_cost: cost,
        lab_name: isCase && form.labName.trim() ? form.labName.trim() : undefined,
        lab_send_date: isCase && form.labSendDate ? form.labSendDate : undefined,
        delivery_date: isCase && form.deliveryDate ? form.deliveryDate : undefined,
        paid: isCase ? paidAmount : undefined,
        remaining: isCase ? cost - paidAmount : undefined,
      });

      setSaving(false);
      onOpenChange(false);
      handleReset();
    } catch {
      setSaving(false);
      setSubmitError("Failed to save record. Please try again.");
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

  if (cycleLocked) return null;

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
                  disabled={saving}
                />
                <Button onClick={handleLookup} size="icon" variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {lookupError && (
                <p className="text-caption text-destructive">{lookupError}</p>
              )}
            </div>
          </div>
        ) : form && foundRecord ? (
          /* Form step — pre-filled with found record */
          <>
            <div key={formKey} className="grid gap-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
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
              {isLookupMode && (
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
              <Button variant="outline" onClick={handleReset} disabled={saving}>
                Back
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
