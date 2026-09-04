// Lab Selector — dropdown for choosing a lab from the available labs list.
// Used in Case form fields. Lab name is required for all case records.

"use client";

import { useData } from "@/context/DataContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LabSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function LabSelector({ value, onChange, disabled }: LabSelectorProps) {
  const { labs } = useData();

  return (
    <Select value={value} onValueChange={(v) => { if (v) onChange(v); }} disabled={disabled}>
      <SelectTrigger className="w-full" aria-invalid={false}>
        <SelectValue placeholder="Select lab" />
      </SelectTrigger>
      <SelectContent>
        {labs.map((lab) => (
          <SelectItem key={lab.id} value={lab.lab_name}>
            {lab.lab_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
