// Patient cards preserve registry identity and expose selection through a labelled touch action.

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataField } from "@/components/shared/dataField";
import type { PatientType } from "@/lib/global";
import { formatRegisteredDate } from "./helpers";

export function PatientCard({ patient, onSelect }: { patient: PatientType; onSelect: (patient: PatientType) => void }) {
  return (
    <Card size="sm" className="min-w-0">
      <CardHeader>
        <CardTitle className="[overflow-wrap:anywhere]">{patient.patient_name}</CardTitle>
        <CardDescription className="[overflow-wrap:anywhere]">{patient.patient_id}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <dl className="space-y-3">
          <DataField label="Registered">{formatRegisteredDate(patient.created_at)}</DataField>
          <DataField label="Address">{patient.address || "Not provided"}</DataField>
        </dl>
        <Button variant="outline" className="w-full" aria-label={`View patient ${patient.patient_name}`} onClick={() => onSelect(patient)}>View patient</Button>
      </CardContent>
    </Card>
  );
}
