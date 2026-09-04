// Case form fields — Patient ID, Name, Address, Case Type, Tooth Numbers,
// Total Cost, Lab Name (required Select), Lab Send Date, Delivery Date, Paid, Remaining.
// Diagnosis is auto-generated from case type + teeth selection.

"use client";

import { Input } from "@/components/ui/input";
import { RecordCategory } from "@/lib/global";
import { FormField } from "./FormField";
import { CaseTypeSelector } from "./CaseTypeSelector";
import { ToothNumberGrid } from "./ToothNumberGrid";
import { LabSelector } from "./LabSelector";
import { useData } from "@/context/DataContext";

interface CaseFormFieldsProps {
  form: {
    patientId: string;
    patientName: string;
    address: string;
    category: RecordCategory;
    diagnosis: string;
    caseType: string;
    teeth: string;
    totalCost: string;
    labName: string;
    labSendDate: string;
    deliveryDate: string;
    paid: string;
  };
  errors: {
    patientId?: string;
    patientName?: string;
    diagnosis?: string;
    caseType?: string;
    teeth?: string;
    totalCost?: string;
    labName?: string;
    paid?: string;
  };
  remaining: string;
  saving: boolean;
  updateField: (field: string, value: string) => void;
}

function generateDiagnosis(caseType: string, teeth: string): string {
  if (!caseType) return "";
  if (!teeth) return caseType;
  return `${caseType} at ${teeth}`;
}

export function CaseFormFields({
  form,
  errors,
  remaining,
  saving,
  updateField,
}: CaseFormFieldsProps) {
  const generatedDiagnosis = generateDiagnosis(form.caseType, form.teeth);

  return (
    <>
      <FormField
        label="Patient ID"
        htmlFor="patientId"
        required
        hint="(e.g. 0001/26)"
        error={errors.patientId}
      >
        <Input
          id="patientId"
          placeholder="e.g. 0001/26"
          value={form.patientId}
          onChange={(e) => updateField("patientId", e.target.value)}
          aria-invalid={!!errors.patientId}
          disabled={saving}
        />
      </FormField>

      <FormField
        label="Patient Name"
        htmlFor="patientName"
        required
        error={errors.patientName}
      >
        <Input
          id="patientName"
          placeholder="e.g. John Doe"
          value={form.patientName}
          onChange={(e) => updateField("patientName", e.target.value)}
          aria-invalid={!!errors.patientName}
          disabled={saving}
        />
      </FormField>

      <FormField
        label="Address"
        htmlFor="address"
        hint="(optional)"
      >
        <Input
          id="address"
          placeholder="e.g. 123 Main St"
          value={form.address}
          onChange={(e) => updateField("address", e.target.value)}
          disabled={saving}
        />
      </FormField>

      <FormField
        label="Case Type"
        htmlFor="caseType"
        required
        error={errors.caseType}
      >
        <CaseTypeSelector
          value={form.caseType}
          onChange={(val) => updateField("caseType", val)}
          disabled={saving}
        />
      </FormField>

      <FormField
        label="Tooth Numbers"
        htmlFor="teeth"
        required
        error={errors.teeth}
      >
        <ToothNumberGrid
          selected={form.teeth}
          onChange={(val) => updateField("teeth", val)}
          disabled={saving}
        />
      </FormField>

      {generatedDiagnosis && (
        <FormField label="Diagnosis (auto-generated)">
          <Input
            value={generatedDiagnosis}
            disabled
            className="bg-muted font-medium"
          />
        </FormField>
      )}

      <FormField
        label="Total Cost"
        htmlFor="totalCost"
        required
        error={errors.totalCost}
      >
        <Input
          id="totalCost"
          type="number"
          min="0"
          step="1"
          placeholder="e.g. 250000"
          value={form.totalCost}
          onChange={(e) => updateField("totalCost", e.target.value)}
          aria-invalid={!!errors.totalCost}
          disabled={saving}
        />
      </FormField>

      <FormField
        label="Lab Name"
        htmlFor="labName"
        required
        error={errors.labName}
      >
        <LabSelector
          value={form.labName}
          onChange={(val) => updateField("labName", val)}
          disabled={saving}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Lab Send Date"
          htmlFor="labSendDate"
        >
          <Input
            id="labSendDate"
            type="date"
            value={form.labSendDate}
            onChange={(e) => updateField("labSendDate", e.target.value)}
            disabled={saving}
          />
        </FormField>

        <FormField
          label="Delivery Date"
          htmlFor="deliveryDate"
        >
          <Input
            id="deliveryDate"
            type="date"
            value={form.deliveryDate}
            onChange={(e) => updateField("deliveryDate", e.target.value)}
            disabled={saving}
          />
        </FormField>
      </div>

      <FormField
        label="Paid"
        htmlFor="paid"
        required
        error={errors.paid}
      >
        <Input
          id="paid"
          type="number"
          min="0"
          step="1"
          placeholder="e.g. 150000"
          value={form.paid}
          onChange={(e) => updateField("paid", e.target.value)}
          aria-invalid={!!errors.paid}
          disabled={saving}
        />
      </FormField>

      <FormField
        label="Remaining"
        htmlFor="remaining"
      >
        <Input
          id="remaining"
          type="number"
          value={remaining}
          disabled
          className="bg-muted"
        />
      </FormField>
    </>
  );
}
