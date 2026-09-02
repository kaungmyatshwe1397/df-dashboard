// Case Type Selector — dropdown for choosing dental procedure type (RPD, Crown, Bridge).
// Used in Case form fields to replace free-text Diagnosis.

"use client";

import { useData } from "@/context/DataContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CaseTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function CaseTypeSelector({ value, onChange, disabled }: CaseTypeSelectorProps) {
  const { caseTypes } = useData();

  return (
    <Select value={value} onValueChange={(v) => { if (v) onChange(v); }} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select case type" />
      </SelectTrigger>
      <SelectContent>
        {caseTypes.map((ct) => (
          <SelectItem key={ct.id} value={ct.name}>
            {ct.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
