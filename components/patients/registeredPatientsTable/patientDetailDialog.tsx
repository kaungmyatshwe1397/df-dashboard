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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ArrowLeft } from "lucide-react";
import { PatientType } from "@/lib/global";
import { usePatients } from "@/context/hooks/usePatients";
import { formatPatientProfileDate } from "./helpers";

export interface PatientDetailDialogPropsType {
  patientId: string;
  onClose: () => void;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className="break-words text-sm text-foreground">
        {value?.trim() || (
          <span className="text-muted-foreground">Not provided</span>
        )}
      </p>
    </div>
  );
}

function DetailList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="space-y-1">
      <p className="text-caption text-muted-foreground">{label}</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">None recorded</p>
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
      <DialogContent
        className="patient-detail-dialog max-h-[90vh] overflow-y-auto sm:max-w-2xl"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="text-h3">
            Registered patient profile
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2">
            <span>{loading ? "Loading patient details…" : "Patient ID"}</span>
            {!loading && patient && (
              <Badge variant="secondary">{patient.patient_id}</Badge>
            )}
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
          <div className="space-y-4 py-1">
            <Card size="sm" className="bg-muted/20">
              <CardHeader className="border-b">
              <CardTitle className="text-h4">Patient information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <DetailRow label="Full name" value={patient.patient_name} />
                </div>
                <DetailRow
                  label="Registered"
                  value={formatPatientProfileDate(patient.created_at)}
                />
                <DetailRow label="Age" value={`${patient.age} years`} />
                <DetailRow label="Gender" value={patient.gender} />
                <div className="sm:col-span-2">
                  <DetailRow label="Address" value={patient.address ?? ""} />
                </div>
              </CardContent>
            </Card>

            <Card size="sm" className="bg-muted/20">
              <CardHeader className="border-b">
              <CardTitle className="text-h4">Health information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div
                  className={
                    patient.drug_allergy?.trim()
                      ? "rounded-lg border border-destructive/20 bg-destructive/5 p-3 sm:col-span-2"
                      : "sm:col-span-2"
                  }
                >
                  <DetailRow
                    label="Drug allergies"
                    value={patient.drug_allergy ?? ""}
                  />
                </div>
                <DetailRow
                  label="Past dental history"
                  value={patient.past_dental_history ?? ""}
                />
                <DetailList
                  label="Past medical history"
                  items={patient.past_medical_history}
                />
                <div className="sm:col-span-2">
                  <DetailList
                    label="Current medications"
                    items={patient.current_medications}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
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
