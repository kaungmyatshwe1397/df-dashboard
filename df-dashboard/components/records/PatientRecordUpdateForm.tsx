// Patient Record Update Form
// Creates or edits a patient record. Writes to DataContext via addRecord().
// Handles all 5 UI states: ideal, loading, error, empty, edge case.

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
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useData } from "@/context/DataContext";
import { RecordCategory, PatientRecord } from "@/lib/global";
import { RecordFormFields } from "./RecordFormFields";

interface PatientRecordUpdateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory?: RecordCategory;
  editRecord?: PatientRecord | null;
}

interface FormErrors {
  patientName?: string;
  diagnosis?: string;
  totalCost?: string;
  amountPaid?: string;
}

function getInitialForm(
  editRecord: PatientRecord | null,
  defaultCategory: RecordCategory
) {
  if (editRecord) {
    return {
      patientName: editRecord.patient_name,
      address: editRecord.address ?? "",
      category: editRecord.category,
      diagnosis: editRecord.diagnosis,
      totalCost: editRecord.total_cost.toString(),
      amountPaid: "",
    };
  }
  return {
    patientName: "",
    address: "",
    category: defaultCategory,
    diagnosis: "",
    totalCost: "",
    amountPaid: "",
  };
}

export function PatientRecordUpdateForm({
  open,
  onOpenChange,
  defaultCategory = RecordCategory.GP,
  editRecord = null,
}: PatientRecordUpdateFormProps) {
  const { addRecord, cycleLocked } = useData();
  const isEditing = !!editRecord;

  const formKey = useMemo(
    () => `${open}-${editRecord?.id ?? "new"}-${defaultCategory}`,
    [open, editRecord?.id, defaultCategory]
  );

  const [form, setForm] = useState(() =>
    getInitialForm(editRecord, defaultCategory)
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isGP = form.category === RecordCategory.GP;
  const effectiveAmountPaid = isGP ? form.totalCost : form.amountPaid;

  function updateField(field: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "category" && value === RecordCategory.GP) {
        next.amountPaid = next.totalCost;
      } else if (field === "totalCost" && prev.category === RecordCategory.GP) {
        next.amountPaid = value;
      }
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field as keyof FormErrors];
      return next;
    });
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!form.patientName.trim()) {
      newErrors.patientName = "Patient name is required.";
    }
    if (!form.diagnosis.trim()) {
      newErrors.diagnosis = "Diagnosis is required.";
    }

    const totalCost = parseFloat(form.totalCost);
    if (!form.totalCost || isNaN(totalCost) || totalCost <= 0) {
      newErrors.totalCost = "Enter a valid cost greater than 0.";
    }

    const amountPaid = parseFloat(effectiveAmountPaid);
    if (effectiveAmountPaid === "" || isNaN(amountPaid) || amountPaid < 0) {
      newErrors.amountPaid = "Enter a valid amount (0 or more).";
    } else if (!isNaN(totalCost) && amountPaid > totalCost) {
      newErrors.amountPaid = "Amount paid cannot exceed total cost.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;

    setSaving(true);
    setSubmitError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const totalCost = parseFloat(form.totalCost);
      const amountPaid = isGP ? totalCost : parseFloat(effectiveAmountPaid);

      addRecord(
        {
          patient_name: form.patientName.trim(),
          address: form.address.trim() || undefined,
          category: form.category,
          diagnosis: form.diagnosis.trim(),
          total_cost: totalCost,
        },
        amountPaid
      );

      setSaving(false);
      onOpenChange(false);
    } catch {
      setSaving(false);
      setSubmitError("Failed to save record. Please try again.");
    }
  }

  if (cycleLocked) return null;

  return (
    <Dialog open={open} onOpenChange={saving ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!saving}>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Patient Record" : "Add Patient Record"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the patient record details below."
              : "Fill in the details to add a new patient record."}
          </DialogDescription>
        </DialogHeader>

        {submitError && (
          <Alert variant="destructive">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <div key={formKey} className="grid gap-4 py-2">
          <RecordFormFields
            form={form}
            errors={errors}
            isGP={isGP}
            effectiveAmountPaid={effectiveAmountPaid}
            saving={saving}
            updateField={updateField}
          />
        </div>

        <DialogFooter showCloseButton>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Add Record"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
