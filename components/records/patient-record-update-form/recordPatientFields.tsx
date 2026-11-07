// Visit demographics stay separate from registration and clinical-history controls.
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormField } from "@/components/shared/formField";
import { Gender } from "@/lib/global";
import type { FormState, FormErrors } from "./Types";
import { filterAgeInput } from "./schema";

interface RecordPatientFieldsPropsType {
  form: FormState;
  errors: FormErrors;
  saving: boolean;
  demographicsDisabled?: boolean;
  updateField: (field: string, value: string) => void;
}

export function RecordPatientFields({ form, errors, saving, demographicsDisabled = false, updateField }: RecordPatientFieldsPropsType) {
  const demographicsLocked = saving || demographicsDisabled;
  return <>
    <FormField label="Patient Name" htmlFor="patientName" required error={errors.patientName}>
      <Input id="patientName" value={form.patientName} disabled={demographicsLocked} aria-invalid={!!errors.patientName}
        onChange={(event) => updateField("patientName", event.target.value)} />
    </FormField>
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField label="Age" htmlFor="age" required error={errors.age}>
        <Input id="age" value={form.age} disabled={demographicsLocked} inputMode="numeric" maxLength={3} aria-invalid={!!errors.age}
          onChange={(event) => updateField("age", filterAgeInput(event.target.value))} />
      </FormField>
      <FormField label="Gender" required error={errors.gender}>
        <RadioGroup value={form.gender} disabled={demographicsLocked} onValueChange={(value) => updateField("gender", value)}
          className="flex flex-wrap items-center gap-4">
          {[{ value: Gender.MALE, label: "Male" }, { value: Gender.FEMALE, label: "Female" }].map((option) =>
            <div key={option.value} className="flex items-center gap-2">
              <RadioGroupItem id={`record-gender-${option.value}`} value={option.value} disabled={demographicsLocked} />
              <Label htmlFor={`record-gender-${option.value}`} className="font-normal">{option.label}</Label>
            </div>)}
        </RadioGroup>
      </FormField>
    </div>
    <FormField label="Address" htmlFor="address" hint="(optional)">
      <Input id="address" value={form.address} disabled={demographicsLocked} onChange={(event) => updateField("address", event.target.value)} />
    </FormField>
    <FormField label="Telephone" htmlFor="telephone" hint="(optional)">
      <Input id="telephone" type="tel" autoComplete="tel" value={form.telephone} disabled={saving}
        onChange={(event) => updateField("telephone", event.target.value)} />
    </FormField>
  </>;
}
