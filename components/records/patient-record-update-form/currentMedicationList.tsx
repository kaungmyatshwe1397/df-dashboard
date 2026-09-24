// CurrentMedicationList — chip-style medication list editor.
// Assistant adds short medication names one by one instead of
// typing one long free-text blob.

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { FormField } from "@/components/shared/formField";

interface CurrentMedicationListProps {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

export function CurrentMedicationList({
  value,
  onChange,
  disabled = false,
}: CurrentMedicationListProps) {
  const [draft, setDraft] = useState("");

  function addMedication() {
    const name = draft.trim();
    if (!name) return;
    const exists = value.some((m) => m.toLowerCase() === name.toLowerCase());
    if (!exists) onChange([...value, name]);
    setDraft("");
  }

  return (
    <FormField label="Current Medication" hint="(optional — add one at a time)">
      <div className="flex gap-2">
        <Input
          id="currentMedication"
          placeholder="e.g. Metformin"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addMedication();
            }
          }}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addMedication}
          disabled={disabled || !draft.trim()}
          aria-label="Add medication"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((med) => (
            <Badge key={med} variant="secondary" className="gap-1 pr-1">
              {med}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => onChange(value.filter((m) => m !== med))}
                disabled={disabled}
                aria-label={`Remove ${med}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </FormField>
  );
}
