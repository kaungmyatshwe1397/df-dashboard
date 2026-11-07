// Lab grouping belongs in a filter so the record list stays compact without losing lab-based lookup.
"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CaseLabFilterPropsType {
  value: string;
  labs: string[];
  onChange: (value: string) => void;
}

export function CaseLabFilter({ value, labs, onChange }: CaseLabFilterPropsType) {
  const items = [{ value: "all", label: "All labs" }, { value: "unassigned", label: "Not assigned" },
    ...labs.map((lab) => ({ value: `lab:${lab}`, label: lab }))];
  return <Select items={items} value={value} onValueChange={(next) => onChange(next ?? "all")}>
    <SelectTrigger id="record-lab-filter" aria-label="Filter cases by lab" className="w-full">
      <SelectValue placeholder="All labs" />
    </SelectTrigger>
    <SelectContent>
      {items.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
    </SelectContent>
  </Select>;
}
