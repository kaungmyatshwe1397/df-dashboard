// GP treatment fields — Diagnosis and Total Cost.
// Identity/demographics live in PatientInfoSection.

import { Input } from "@/components/ui/input";
import { RecordCategory } from "@/lib/global";
import { FormField } from "@/components/shared/formField";

interface RecordFormFieldsProps {
  form: {
    category: RecordCategory;
    diagnosis: string;
    totalCost: string;
  };
  errors: {
    diagnosis?: string;
    totalCost?: string;
  };
  saving: boolean;
  updateField: (field: string, value: string) => void;
}

export function RecordFormFields({
  form,
  errors,
  saving,
  updateField,
}: RecordFormFieldsProps) {
  return (
    <>
      <FormField
        label="Diagnosis & Treatment"
        htmlFor="diagnosis"
        required
        error={errors.diagnosis}
      >
        <Input
          id="diagnosis"
          placeholder="e.g. Common cold, Fracture - left arm"
          value={form.diagnosis}
          onChange={(e) => updateField("diagnosis", e.target.value)}
          aria-invalid={!!errors.diagnosis}
          disabled={saving}
        />
      </FormField>

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
          placeholder="e.g. 50000"
          value={form.totalCost}
          onChange={(e) => updateField("totalCost", e.target.value)}
          aria-invalid={!!errors.totalCost}
          disabled={saving}
        />
      </FormField>
    </>
  );
}
