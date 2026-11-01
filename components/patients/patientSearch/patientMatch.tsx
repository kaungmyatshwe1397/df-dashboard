// Explicit selection and demographic context help distinguish patients with the same name.
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PatientType } from "@/lib/global";

interface PatientMatchPropsType {
  patient: PatientType;
  onSelect?: (patient: PatientType) => void;
  disabled?: boolean;
}

export function PatientMatch({ patient, onSelect, disabled }: PatientMatchPropsType) {
  return <Card size="sm"><CardContent className="grid gap-2">
    <p className="break-words font-medium">{patient.patient_name}</p>
    <p className="text-body-sm text-muted-foreground">{patient.patient_id ?? "Not assigned"} · Age {patient.age} · {patient.gender}</p>
    <p className="break-words text-body-sm">{patient.address || "Address not provided"}</p>
    <Badge variant="secondary">{patient.is_registered ? "Registered" : "Unregistered"}</Badge>
    {onSelect && <Button type="button" variant="outline" disabled={disabled}
      onClick={() => onSelect(patient)} aria-label={`Select ${patient.patient_name}, ${patient.patient_id ?? "unregistered"}, age ${patient.age}`}>Select patient</Button>}
  </CardContent></Card>;
}
