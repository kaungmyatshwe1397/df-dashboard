// LabFeeInput — inline editable lab fee field for a case record.
// Extracted from LabReconciliationTable to keep each component focused.

"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { CasePatientRecordType } from "@/lib/global";

export interface LabFeeInputProps {
  record: CasePatientRecordType;
  onSave: (recordId: string, fee: number) => void;
  saving: boolean;
  readOnly?: boolean;
}

export function LabFeeInput({ record, onSave, saving, readOnly }: LabFeeInputProps) {
  const [value, setValue] = useState(record.lab_fee?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed === "") {
      onSave(record.id, 0);
      setError(null);
      return;
    }

    const parsed = Number(trimmed);
    if (isNaN(parsed)) {
      setError("Must be a number");
      return;
    }
    if (parsed < 0) {
      setError("Cannot be negative");
      return;
    }
    setError(null);
    onSave(record.id, parsed);
  }, [value, record.id, onSave]);

  return (
    <div className="flex w-full min-w-0 flex-col gap-1 lg:w-auto">
      <Input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(null);
        }}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
        }}
        disabled={saving || readOnly}
        aria-invalid={!!error}
        aria-describedby={error ? `lab-fee-error-${record.id}` : undefined}
        className="h-8 w-full text-right lg:w-28"
        placeholder="0"
        aria-label={`Lab fee for ${record.patient_name}`}
      />
      {saving && <span role="status" className="text-caption text-muted-foreground">Saving fee…</span>}
      {error && (
        <span id={`lab-fee-error-${record.id}`} className="text-xs text-destructive">{error}</span>
      )}
    </div>
  );
}
