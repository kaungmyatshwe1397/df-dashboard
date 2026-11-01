// Sort visits before pagination so changing order never hides or duplicates a visit between pages.
"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import type { PatientRecordBaseType } from "@/lib/global";

export type RecordSortValueType = "date:desc" | "date:asc" | "id:asc" | "id:desc" | "name:asc" | "name:desc";

export function sortRecords<T extends PatientRecordBaseType>(records: T[], sortValue: RecordSortValueType): T[] {
  const [key, direction] = sortValue.split(":");
  const factor = direction === "desc" ? -1 : 1;
  return [...records].sort((left, right) => {
    if (key === "id") {
      if (!left.patient_id) return right.patient_id ? 1 : left.id.localeCompare(right.id);
      if (!right.patient_id) return -1;
      const comparison = left.patient_id.localeCompare(right.patient_id, undefined, { numeric: true });
      return comparison * factor || left.id.localeCompare(right.id);
    }
    const comparison = key === "name"
      ? left.patient_name.localeCompare(right.patient_name, undefined, { sensitivity: "base" })
      : left.entry_date.localeCompare(right.entry_date);
    return comparison * factor || left.id.localeCompare(right.id);
  });
}

export function RecordSortMenu({ value, onChange }: { value: RecordSortValueType; onChange: (value: RecordSortValueType) => void }) {
  function selectSort(next: string) {
    if (next === "date:desc" || next === "date:asc" || next === "id:asc" || next === "id:desc" || next === "name:asc" || next === "name:desc") onChange(next);
  }
  return <DropdownMenu>
    <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>Sort by<ChevronDown className="size-4" /></DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="min-w-48">
      <DropdownMenuRadioGroup value={value} onValueChange={selectSort}>
        <DropdownMenuRadioItem value="date:desc">Date: newest first</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="date:asc">Date: oldest first</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="id:asc">Patient ID: ascending</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="id:desc">Patient ID: descending</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="name:asc">Name: A–Z</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="name:desc">Name: Z–A</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>;
}
