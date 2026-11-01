// The same profile actions stay reachable in both table rows and mobile cards.
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PatientType } from "@/lib/global";

interface DirectoryRowsPropsType {
  patients: PatientType[];
  rowOffset: number;
  onSelect: (patient: PatientType) => void;
}

export function DirectoryRows(props: DirectoryRowsPropsType) {
  function actions(patient: PatientType) {
    return <div className="flex justify-end">
      <Button variant="outline" size="sm" onClick={() => props.onSelect(patient)}>View patient</Button>
    </div>;
  }
  return <>
    <div className="grid gap-4 lg:hidden">{props.patients.map((patient, index) => <Card key={patient.id} size="sm"><CardContent className="grid gap-2">
      <p className="text-caption text-muted-foreground">#{props.rowOffset + index + 1} · Patient ID: {patient.patient_id ?? "Not assigned"}</p>
      <p className="break-words text-h4 font-semibold">{patient.patient_name}</p>
      <p className="text-body-sm text-muted-foreground">Age {patient.age}</p>
      <p className="break-words text-body-sm">{patient.address || "Address not provided"}</p>
      {actions(patient)}
    </CardContent></Card>)}</div>
    <div className="hidden lg:block"><Table>
      <TableHeader><TableRow><TableHead className="w-10">#</TableHead><TableHead>Patient ID</TableHead><TableHead>Name</TableHead><TableHead>Age</TableHead>
        <TableHead>Address</TableHead><TableHead className="text-right">Patient</TableHead></TableRow></TableHeader>
      <TableBody>{props.patients.map((patient, index) => <TableRow key={patient.id}>
        <TableCell className="text-caption text-muted-foreground">{props.rowOffset + index + 1}</TableCell>
        <TableCell className="text-body-sm text-muted-foreground">{patient.patient_id ?? "Not assigned"}</TableCell>
        <TableCell className="break-words text-h4 font-semibold">{patient.patient_name}</TableCell>
        <TableCell className="text-body-sm">{patient.age}</TableCell><TableCell className="max-w-64 truncate text-body-sm text-muted-foreground" title={patient.address || undefined}>{patient.address || "Not provided"}</TableCell>
        <TableCell>{actions(patient)}</TableCell>
      </TableRow>)}</TableBody>
    </Table></div>
  </>;
}
