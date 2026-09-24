// PatientInfoSection — identity + demographics fields.
// Patient ID triggers a registry lookup on blur (add mode) so a returning
// patient locks all identity fields; a new patient leaves them editable.

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { FormField } from "@/components/shared/formField";
import { Gender } from "@/lib/global";
import { FormState, FormErrors } from "./Types";

interface PatientInfoSectionProps {
  form: FormState;
  errors: FormErrors;
  saving: boolean;
  /** Patient ID is immutable once linked (returning flow or edit mode). */
  idLocked: boolean;
  /** All identity fields locked — returning patient, only treatment is editable. */
  demographicsLocked: boolean;
  checkingPatient: boolean;
  lookupNotice: string | null;
  idCheckError: string | null;
  onPatientIdBlur: () => void;
  onPatientIdChange: (value: string) => void;
  updateField: (field: string, value: string) => void;
}

const GENDER_OPTIONS = [
  { value: Gender.MALE, label: "Male" },
  { value: Gender.FEMALE, label: "Female" },
];

export function PatientInfoSection({
  form,
  errors,
  saving,
  idLocked,
  demographicsLocked,
  checkingPatient,
  lookupNotice,
  idCheckError,
  onPatientIdBlur,
  onPatientIdChange,
  updateField,
}: PatientInfoSectionProps) {
  const locked = saving || demographicsLocked;

  return (
    <>
      <FormField
        label="Patient ID"
        htmlFor="patientId"
        required
        hint="(e.g. 0001/26)"
        error={errors.patientId ?? idCheckError ?? undefined}
      >
        <Input
          id="patientId"
          placeholder="e.g. 0001/26"
          value={form.patientId}
          onChange={(e) => onPatientIdChange(e.target.value)}
          onBlur={onPatientIdBlur}
          aria-invalid={!!errors.patientId}
          disabled={saving || idLocked}
        />
      </FormField>

      {checkingPatient && (
        <p className="text-caption text-muted-foreground flex items-center gap-2">
          <Spinner className="h-3 w-3" />
          Checking Patient ID…
        </p>
      )}

      {lookupNotice && (
        <Alert data-testid="returning-patient-alert">
          <AlertDescription>{lookupNotice}</AlertDescription>
        </Alert>
      )}

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
          disabled={locked}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Age" htmlFor="age" required error={errors.age}>
          <Input
            id="age"
            type="number"
            min="0"
            max="120"
            placeholder="e.g. 30"
            value={form.age}
            onChange={(e) => updateField("age", e.target.value)}
            aria-invalid={!!errors.age}
            disabled={locked}
          />
        </FormField>

        <FormField label="Gender" required>
          <RadioGroup
            value={form.gender}
            onValueChange={(value) => updateField("gender", value)}
            disabled={locked}
            className="flex flex-row items-center gap-4 pt-2"
          >
            {GENDER_OPTIONS.map((opt) => (
              <div key={opt.value} className="flex items-center gap-2">
                <RadioGroupItem
                  value={opt.value}
                  id={`gender-${opt.value.toLowerCase()}`}
                  disabled={locked}
                />
                <Label
                  htmlFor={`gender-${opt.value.toLowerCase()}`}
                  className="font-normal"
                >
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </FormField>
      </div>

      <FormField label="Address" htmlFor="address" hint="(optional)">
        <Input
          id="address"
          placeholder="e.g. 123 Main St"
          value={form.address}
          onChange={(e) => updateField("address", e.target.value)}
          disabled={locked}
        />
      </FormField>

      <FormField
        label="Drug Allergy"
        htmlFor="drugAllergy"
        hint="(optional)"
      >
        <Input
          id="drugAllergy"
          placeholder="e.g. Penicillin"
          value={form.drugAllergy}
          onChange={(e) => updateField("drugAllergy", e.target.value)}
          disabled={locked}
        />
      </FormField>

      <FormField
        label="Past Dental History"
        htmlFor="pastDentalHistory"
        hint="(optional)"
      >
        <Textarea
          id="pastDentalHistory"
          placeholder="e.g. Extracted tooth 36 two years ago"
          value={form.pastDentalHistory}
          onChange={(e) => updateField("pastDentalHistory", e.target.value)}
          disabled={locked}
          rows={2}
        />
      </FormField>
    </>
  );
}
