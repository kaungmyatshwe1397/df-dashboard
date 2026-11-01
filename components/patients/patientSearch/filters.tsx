// Reusing these controls keeps patient selection and visit filtering understandable in both portals.
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PatientFiltersType } from "@/lib/global";
import { EMPTY_PATIENT_FILTERS } from "@/lib/patient-search";
import { useId } from "react";

interface PatientSearchFiltersPropsType {
  value: PatientFiltersType;
  onChange: (filters: PatientFiltersType) => void;
  disabled?: boolean;
  showRegistration?: boolean;
}

export function PatientSearchFilters({ value, onChange, disabled = false, showRegistration = true }: PatientSearchFiltersPropsType) {
  const id = useId();
  function update(field: keyof PatientFiltersType, next: string) {
    onChange({ ...value, [field]: next });
  }
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <div className="grid gap-2">
      <Label htmlFor={`${id}-query`}>Name or clinic ID</Label>
      <Input id={`${id}-query`} value={value.query} disabled={disabled} placeholder="Search patients"
        onChange={(event) => update("query", event.target.value)} />
    </div>
    <div className="grid gap-2">
      <Label htmlFor={`${id}-address`}>Location / address</Label>
      <Input id={`${id}-address`} value={value.address} disabled={disabled}
        onChange={(event) => update("address", event.target.value)} />
    </div>
    <div className="grid gap-2">
      <Label htmlFor={`${id}-age`}>Age</Label>
      <Input id={`${id}-age`} value={value.age} disabled={disabled} inputMode="numeric" maxLength={3}
        onChange={(event) => update("age", event.target.value.replace(/\D/g, "").slice(0, 3))} />
    </div>
    <div className="grid gap-2">
      <Label htmlFor={`${id}-gender`}>Gender</Label>
      <Select value={value.gender || "all"} onValueChange={(next) => update("gender", !next || next === "all" ? "" : next)} disabled={disabled}>
        <SelectTrigger id={`${id}-gender`} className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All genders</SelectItem><SelectItem value="MALE">Male</SelectItem>
          <SelectItem value="FEMALE">Female</SelectItem><SelectItem value="OTHER">Other</SelectItem>
        </SelectContent>
      </Select>
    </div>
    {showRegistration && <div className="grid gap-2">
      <Label htmlFor={`${id}-registration`}>Registration</Label>
      <Select value={value.registration} onValueChange={(next) => update("registration", next ?? "all")} disabled={disabled}>
        <SelectTrigger id={`${id}-registration`} className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">All patients</SelectItem><SelectItem value="registered">Registered</SelectItem>
          <SelectItem value="unregistered">Unregistered</SelectItem></SelectContent>
      </Select>
    </div>}
    <Button type="button" variant="outline" disabled={disabled} className="self-end"
      onClick={() => onChange({ ...EMPTY_PATIENT_FILTERS, registration: showRegistration ? "all" : value.registration })}>Clear filters</Button>
  </div>;
}
