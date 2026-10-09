// PatientDetailDialog — read-only registry card for one patient.
// Opened from the detail route (?id=NNNN/YY); fetches the registry row
// itself so both admin and assistant detail pages stay thin.
// States: loading, found, not-found, fetch error (retry).

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ArrowLeft } from "lucide-react";
import { PatientType } from "@/lib/global";
import { usePatients } from "@/context/hooks/usePatients";
import { formatRegisteredDate } from "./helpers";

export interface PatientDetailDialogPropsType {
  patientId: string;
  onClose: () => void;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value || "—"}</p>
    </div>
  );
}

function DetailList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="space-y-1">
      <p className="text-caption text-muted-foreground">{label}</p>
      {items.length === 0 ? (
        <p className="text-sm text-foreground">—</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <Badge key={item} variant="secondary">
              {item}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function PatientDetailDialog({
  patientId,
  onClose,
}: PatientDetailDialogPropsType) {
  const { findPatientById } = usePatients();
  const [patient, setPatient] = useState<PatientType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    // No ?id= in the URL — render the not-found state without a network call.
    if (!patientId.trim()) {
      setPatient(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setPatient(await findPatientById(patientId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load patient details."
      );
    } finally {
      setLoading(false);
    }
  }, [findPatientById, patientId]);

  // Initial fetch on mount: only the loading flag flips synchronously —
  // patient/error land after the promise resolves.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Patient Details</DialogTitle>
          <DialogDescription>
            {loading ? "Loading patient…" : patientId}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="space-y-3 py-2" data-testid="patient-detail-loading">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}

        {!loading && error && (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={load}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {!loading && !error && !patient && (
          <div className="py-4 text-center" data-testid="patient-not-found">
            <p className="text-sm text-muted-foreground mb-1">
              {patientId.trim() ? (
                <>
                  Patient <span className="font-medium">{patientId}</span> was
                  not found.
                </>
              ) : (
                "No Patient ID was provided."
              )}
            </p>
            <p className="text-caption text-muted-foreground">
              It may have been removed from the registry.
            </p>
          </div>
        )}

        {!loading && !error && patient && (
          <div className="grid grid-cols-2 gap-4 py-2">
            <DetailRow label="Patient ID" value={patient.patient_id} />
            <DetailRow
              label="Registered"
              value={formatRegisteredDate(patient.created_at)}
            />
            <DetailRow label="Name" value={patient.patient_name} />
            <DetailRow label="Age" value={String(patient.age)} />
            <div className="space-y-1">
              <p className="text-caption text-muted-foreground">Gender</p>
              <Badge variant="secondary">{patient.gender}</Badge>
            </div>
            <DetailRow label="Address" value={patient.address ?? ""} />
            <DetailRow label="Drug Allergy" value={patient.drug_allergy ?? ""} />
            <DetailRow
              label="Past Dental History"
              value={patient.past_dental_history ?? ""}
            />
            <DetailList
              label="Past Medical History"
              items={patient.past_medical_history}
            />
            <DetailList
              label="Current Medications"
              items={patient.current_medications}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowLeft className="mr-2 h-4 w-4" />
            )}
            Back to list
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
