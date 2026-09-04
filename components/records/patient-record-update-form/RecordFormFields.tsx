// GP form fields — Patient ID, Name, Address, Diagnosis, Total Cost.

import { Input } from "@/components/ui/input";
import { RecordCategory } from "@/lib/global";
import { FormField } from "@/components/shared/FormField";

interface RecordFormFieldsProps {
  form: {
    patientId: string;
    patientName: string;
    address: string;
    category: RecordCategory;
    diagnosis: string;
    totalCost: string;
  };
  errors: {
    patientId?: string;
    patientName?: string;
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
