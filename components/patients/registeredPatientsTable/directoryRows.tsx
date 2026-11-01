// The same profile actions stay reachable in both table rows and mobile cards.
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PatientType } from "@/lib/global";
import { formatRegisteredDate } from "./helpers";

interface DirectoryRowsPropsType {
  patients: PatientType[];
  canEdit: boolean;
  busy: boolean;
  onSelect: (patient: PatientType) => void;
  onEdit: (patient: PatientType, registration: boolean) => void;
  onUnregister: (patient: PatientType) => void;
}

export function DirectoryRows(props: DirectoryRowsPropsType) {
  function actions(patient: PatientType) {
    return <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" disabled={props.busy} onClick={() => props.onSelect(patient)}>View profile</Button>
      {props.canEdit && <>
        <Button variant="outline" size="sm" disabled={props.busy} onClick={() => props.onEdit(patient, false)}>Edit {patient.patient_name}</Button>
        {patient.is_registered ? <Button variant="outline" size="sm" disabled={props.busy} onClick={() => props.onUnregister(patient)}>Unregister</Button>
          : <Button size="sm" disabled={props.busy} onClick={() => props.onEdit(patient, true)}>Register</Button>}
      </>}
    </div>;
  }
  return <>
    <div className="grid gap-4 lg:hidden">{props.patients.map((patient) => <Card key={patient.id} size="sm"><CardContent className="grid gap-2">
      <p className="break-words font-medium">{patient.patient_name}</p>
      <p className="text-body-sm">{patient.patient_id ?? "Not assigned"} · Age {patient.age} · {patient.gender}</p>
      <p className="break-words text-body-sm">{patient.address || "Address not provided"}</p>
      <p className="text-body-sm text-muted-foreground">{patient.is_registered ? "Registered" : "Unregistered"}</p>
      {actions(patient)}
    </CardContent></Card>)}</div>
    <div className="hidden lg:block"><Table>
      <TableHeader><TableRow><TableHead>Patient ID</TableHead><TableHead>Name</TableHead><TableHead>Age / Gender</TableHead>
        <TableHead>Address</TableHead><TableHead>Registered</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
      <TableBody>{props.patients.map((patient) => <TableRow key={patient.id}>
        <TableCell>{patient.patient_id ?? "Not assigned"}</TableCell><TableCell className="break-words">{patient.patient_name}</TableCell>
        <TableCell>{patient.age} / {patient.gender}</TableCell><TableCell className="break-words">{patient.address || "Not provided"}</TableCell>
        <TableCell>{formatRegisteredDate(patient.registered_at)}</TableCell><TableCell>{actions(patient)}</TableCell>
      </TableRow>)}</TableBody>
    </Table></div>
  </>;
}
