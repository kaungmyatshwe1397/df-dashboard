// MedicalHistory — multi-select of dynamic past-medical-history options.
// Options load from medical_history_options (DB-driven, never hardcoded).

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/shared/formField";
import { MedicalHistoryOptionType } from "@/lib/global";

interface MedicalHistoryProps {
  options: MedicalHistoryOptionType[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

export function MedicalHistory({
  options,
  selected,
  onChange,
  disabled = false,
}: MedicalHistoryProps) {
  function toggle(name: string, checked: boolean) {
    onChange(
      checked
        ? [...selected, name]
        : selected.filter((s) => s !== name)
    );
  }

  return (
    <FormField label="Past Medical History" hint="(optional)">
      {options.length === 0 ? (
        <p className="text-caption text-muted-foreground">
          No medical history options available yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-md border p-3 sm:grid-cols-3">
          {options.map((opt) => {
            const id = `pmh-${opt.id}`;
            const checked = selected.includes(opt.name);
            return (
              <div key={opt.id} className="flex items-center gap-2">
                <Checkbox
                  id={id}
                  checked={checked}
                  onCheckedChange={(state) => toggle(opt.name, state === true)}
                  disabled={disabled}
                />
                <Label htmlFor={id} className="font-normal text-caption">
                  {opt.name}
                </Label>
              </div>
            );
          })}
        </div>
      )}
    </FormField>
  );
}
