// Similar demographics are a review prompt, not proof that two patients are the same person.
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { PatientSearchResultType, PatientType } from "@/lib/global";
import { PatientMatch } from "./patientMatch";

interface DuplicateWarningPropsType {
  result: PatientSearchResultType;
  onSelect: (patient: PatientType) => void;
  onConfirm: () => void;
  disabled?: boolean;
}

export function DuplicateWarning({ result, onSelect, onConfirm, disabled }: DuplicateWarningPropsType) {
  return <div className="grid gap-4">
    <Alert><AlertDescription>{result.total} existing patients have the same name, age, and gender. Check their details before creating another profile.</AlertDescription></Alert>
    {result.patients.map((patient) => <PatientMatch key={patient.id} patient={patient} onSelect={onSelect} disabled={disabled} />)}
    {result.total > result.patients.length && <p className="text-body-sm">More matches exist. Use patient search to review all matches.</p>}
    <Button type="button" variant="outline" disabled={disabled} onClick={onConfirm}>This is a different person — create a new patient</Button>
  </div>;
}
