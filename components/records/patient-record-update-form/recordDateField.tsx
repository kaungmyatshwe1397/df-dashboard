// Both record categories share a calendar date that controls their monthly cycle.

import { FormField } from "@/components/shared/formField";
import { Input } from "@/components/ui/input";
import { getLocalDate } from "@/lib/record-date";

interface RecordDateFieldPropsType {
  value: string;
  error?: string;
  saving: boolean;
  onChange: (value: string) => void;
}

export function RecordDateField({ value, error, saving, onChange }: RecordDateFieldPropsType) {
  return (
    <FormField label="Record Date" htmlFor="recordDate" required error={error}>
      <Input
        id="recordDate"
        type="date"
        required
        max={getLocalDate()}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={!!error}
        disabled={saving}
      />
    </FormField>
  );
}
