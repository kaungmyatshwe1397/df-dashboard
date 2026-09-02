// Case form fields — Patient ID, Name, Address, Diagnosis, Total Cost,
// Lab Name, Lab Send Date, Delivery Date, Paid, Remaining.

import { Input } from "@/components/ui/input";
import { RecordCategory } from "@/lib/global";
import { FormField } from "./FormField";

interface CaseFormFieldsProps {
  form: {
    patientId: string;
    patientName: string;
    address: string;
    category: RecordCategory;
    diagnosis: string;
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
    totalCost?: string;
    paid?: string;
  };
  remaining: string;
  saving: boolean;
  updateField: (field: string, value: string) => void;
}

export function CaseFormFields({
  form,
  errors,
  remaining,
  saving,
  updateField,
}: CaseFormFieldsProps) {
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
          placeholder="e.g. Fracture - left arm"
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
        hint="(optional)"
      >
        <Input
          id="labName"
          placeholder="e.g. Central Lab"
          value={form.labName}
          onChange={(e) => updateField("labName", e.target.value)}
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
          step="0.01"
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
