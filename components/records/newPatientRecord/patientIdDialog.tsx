// Confirming a clinic ID before entry prevents a visit from silently attaching to the wrong person.
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { usePatients } from "@/context/hooks/usePatients";
import type { PatientType } from "@/lib/global";
import { filterPatientIdInput, isCurrentYearPatientIdValid, isPatientIdShapeValid, PATIENT_ID_FORMAT_ERROR, PATIENT_ID_YEAR_ERROR } from "@/components/records/patient-record-update-form/schema";

export type PatientChoiceType =
  | { kind: "existing"; patient: PatientType; patientIdToRegister?: string }
  | { kind: "registered"; patientId: string }
  | { kind: "unregistered" };

export function PatientIdDialog({ open, onOpenChange, onChoose }: { open: boolean; onOpenChange: (open: boolean) => void; onChoose: (choice: PatientChoiceType) => void }) {
  const { findPatientById } = usePatients();
  const [patientId, setPatientId] = useState("");
  const [match, setMatch] = useState<PatientType | null>(null);
  const [checkedNewId, setCheckedNewId] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function changeId(value: string) {
    setPatientId(filterPatientIdInput(value));
    setMatch(null);
    setCheckedNewId(false);
    setError(null);
  }

  async function checkId() {
    if (!isPatientIdShapeValid(patientId)) { setError(PATIENT_ID_FORMAT_ERROR); return; }
    setChecking(true); setError(null); setMatch(null); setCheckedNewId(false);
    try {
      const existing = await findPatientById(patientId);
      if (existing) setMatch(existing);
      else if (!isCurrentYearPatientIdValid(patientId)) setError(PATIENT_ID_YEAR_ERROR);
      else setCheckedNewId(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not check this patient ID."); }
    finally { setChecking(false); }
  }

  function choose(choice: PatientChoiceType) {
    onChoose(choice); onOpenChange(false);
    setPatientId(""); setMatch(null); setCheckedNewId(false); setError(null);
  }

  return <Dialog open={open} onOpenChange={checking ? undefined : onOpenChange}>
    <DialogContent className="sm:max-w-sm">
      <DialogHeader><DialogTitle>Patient ID</DialogTitle><DialogDescription>Enter a clinic ID to verify the patient, or continue without an ID as unregistered.</DialogDescription></DialogHeader>
      <div className="grid gap-3">
        <Label htmlFor="new-record-patient-id">Clinic ID</Label>
        <div className="flex gap-2"><Input id="new-record-patient-id" value={patientId} onChange={(event) => changeId(event.target.value)} placeholder="0001/26" inputMode="numeric" disabled={checking} /><Button variant="outline" size="sm" onClick={checkId} disabled={checking}>Check ID</Button></div>
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        {match && <Alert><AlertDescription><strong>{match.patient_name}</strong> · Age {match.age} · {match.gender.toLowerCase()} · {match.address || "Address not provided"}. Confirm this is the correct patient before continuing.</AlertDescription></Alert>}
        {checkedNewId && <Alert><AlertDescription>No patient has this ID. Continuing will register a new patient as {patientId}.</AlertDescription></Alert>}
      </div>
      <DialogFooter className="flex-wrap">
        <Button variant="outline" size="sm" onClick={() => choose({ kind: "unregistered" })} disabled={checking}>Unregistered</Button>
        <Button size="sm" onClick={() => match ? choose({ kind: "existing", patient: match }) : choose({ kind: "registered", patientId })} disabled={checking || (!match && !checkedNewId)}>Continue</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
