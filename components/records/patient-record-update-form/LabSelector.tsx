// Lab Selector — dropdown for choosing a lab from the available labs list.
// Cases may be saved before lab assignment and assigned or cleared later.

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
  const items = [{ value: "__unassigned__", label: "Not assigned" },
    ...labs.map((lab) => ({ value: lab.lab_name, label: lab.lab_name }))];

  return (
    <Select items={items} value={value || "__unassigned__"} onValueChange={(v) => { if (v) onChange(v === "__unassigned__" ? "" : v); }} disabled={disabled}>
      <SelectTrigger id="labName" className="w-full">
        <SelectValue placeholder="Not assigned" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__unassigned__">Not assigned</SelectItem>
        {labs.map((lab) => (
          <SelectItem key={lab.id} value={lab.lab_name}>
            {lab.lab_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
