// LabFeeInput — inline editable number field for lab fee per case record.
// Extracted from LabReconciliationTable to keep each component focused.

"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { CasePatientRecordType } from "@/lib/global";

export interface LabFeeInputProps {
  record: CasePatientRecordType;
  onSave: (recordId: string, fee: number) => void;
  saving: boolean;
  cycleLocked: boolean;
}

export function LabFeeInput({ record, onSave, saving, cycleLocked }: LabFeeInputProps) {
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
    <div className="flex flex-col gap-1">
      <Input
        type="number"
        min={0}
        step="1"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(null);
        }}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
        }}
        disabled={cycleLocked || saving}
        className="h-8 w-28 text-right"
        placeholder="0"
      />
      {error && (
        <span className="text-xs text-destructive">{error}</span>
      )}
    </div>
  );
}
