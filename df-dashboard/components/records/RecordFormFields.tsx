// Record form fields — pure presentational, receives state and handlers as props.

import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { RecordCategory } from "@/lib/global";
import { FormField } from "./FormField";

interface RecordFormFieldsProps {
  form: {
    patientName: string;
    address: string;
    category: RecordCategory;
    diagnosis: string;
    totalCost: string;
    amountPaid: string;
  };
  errors: {
    patientName?: string;
    diagnosis?: string;
    totalCost?: string;
    amountPaid?: string;
  };
  isGP: boolean;
  effectiveAmountPaid: string;
  saving: boolean;
  updateField: (field: string, value: string) => void;
}

export function RecordFormFields({
  form,
  errors,
  isGP,
  effectiveAmountPaid,
  saving,
  updateField,
}: RecordFormFieldsProps) {
  return (
    <>
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

      <FormField label="Category" required>
        <RadioGroup
          value={form.category}
          onValueChange={(val) => updateField("category", val)}
          className="flex gap-4"
          disabled={saving || false}
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value={RecordCategory.GP} id="cat-gp" />
            <Label htmlFor="cat-gp" className="font-normal cursor-pointer">
              GP
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value={RecordCategory.CASE} id="cat-case" />
            <Label htmlFor="cat-case" className="font-normal cursor-pointer">
              Case
            </Label>
          </div>
        </RadioGroup>
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
          step="0.01"
          placeholder="e.g. 50000"
          value={form.totalCost}
          onChange={(e) => updateField("totalCost", e.target.value)}
          aria-invalid={!!errors.totalCost}
          disabled={saving}
        />
      </FormField>

      <FormField
        label="Amount Paid Today"
        htmlFor="amountPaid"
        required
        hint={isGP ? "(auto-filled for GP)" : undefined}
        error={errors.amountPaid}
      >
        <Input
          id="amountPaid"
          type="number"
          min="0"
          step="0.01"
          placeholder="e.g. 50000"
          value={effectiveAmountPaid}
          onChange={(e) => updateField("amountPaid", e.target.value)}
          aria-invalid={!!errors.amountPaid}
          disabled={saving || isGP}
        />
        {!errors.amountPaid && isGP && form.totalCost && (
          <p className="text-caption text-muted-foreground">
            Full amount collected for GP visits.
          </p>
        )}
      </FormField>
    </>
  );
}
