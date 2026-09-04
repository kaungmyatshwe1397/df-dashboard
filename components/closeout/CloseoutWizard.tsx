// Closeout wizard — 2-step flow: Preview partition, then Confirm to close cycle.
// Settled records (GP + paid Case) are purged; unsettled Case records carry forward to new cycle.

"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useData } from "@/context/DataContext";
import { RecordCategory } from "@/lib/global";

type WizardStep = "preview" | "confirm" | "executing" | "done";

export function CloseoutWizard() {
  const { records, getRecordBalance, closeoutCycle, cycleLocked } = useData();

  const [step, setStep] = useState<WizardStep>("preview");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    settledCount: number;
    unsettledCount: number;
  } | null>(null);

  // Partition records for preview
  const settledRecords = records.filter(
    (r) =>
      r.category === RecordCategory.GP ||
      (r.category === RecordCategory.CASE && getRecordBalance(r) <= 0)
  );
  const unsettledRecords = records.filter(
    (r) =>
      r.category === RecordCategory.CASE && getRecordBalance(r) > 0
  );

  const settledCount = settledRecords.length;
  const unsettledCount = unsettledRecords.length;
  const totalCount = settledCount + unsettledCount;

  function handleConfirm() {
    setStep("executing");
    setError(null);

    // Simulate async execution with progress
    setTimeout(() => {
      try {
        const closeResult = closeoutCycle();
        setResult(closeResult);
        setStep("done");
      } catch {
        setError("Closeout failed. No changes were made. Please try again.");
        setStep("confirm");
      }
    }, 800);
  }

  if (cycleLocked && step === "preview") {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            This cycle is already closed. No closeout action is needed.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
        <Badge variant={step === "preview" ? "default" : "outline"}>1. Preview</Badge>
        <ArrowRight className="h-3 w-3" />
        <Badge variant={step === "confirm" || step === "executing" ? "default" : "outline"}>
          2. Confirm
        </Badge>
        <ArrowRight className="h-3 w-3" />
        <Badge variant={step === "done" ? "default" : "outline"}>Done</Badge>
      </div>

      {/* Step 1 — Preview */}
      {step === "preview" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-body-sm font-medium text-muted-foreground">
              Closeout Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-md border p-4 text-center">
                <p className="text-2xl font-bold">{totalCount}</p>
                <p className="text-caption text-muted-foreground">Total Records</p>
              </div>
              <div className="rounded-md border p-4 text-center">
                <p className="text-2xl font-bold text-success">{settledCount}</p>
                <p className="text-caption text-muted-foreground">Will Be Purged</p>
              </div>
              <div className="rounded-md border p-4 text-center">
                <p className="text-2xl font-bold text-warning">{unsettledCount}</p>
                <p className="text-caption text-muted-foreground">Will Carry Forward</p>
              </div>
            </div>

            {unsettledCount > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-body-sm font-medium mb-2">Unsettled Cases (Carry Forward)</h4>
                  <div className="space-y-2">
                    {unsettledRecords.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between rounded-md border px-4 py-2"
                      >
                        <div className="flex flex-col">
                          <span className="text-body-sm font-medium">{r.patient_name}</span>
                          <span className="text-caption text-muted-foreground">
                            {r.patient_id}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-warning border-warning">
                          {getRecordBalance(r).toLocaleString()} remaining
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div className="flex justify-end">
              <Button
                onClick={() => setStep("confirm")}
                disabled={totalCount === 0}
              >
                Proceed to Confirm
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2 — Confirm */}
      {step === "confirm" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-body-sm font-medium text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Confirm Closeout
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              This action is irreversible. {settledCount} settled record(s) will be
              permanently removed. {unsettledCount} unsettled case(s) will be moved
              to the next cycle.
            </Alert>

            {error && (
              <Alert variant="destructive">{error}</Alert>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStep("preview")}>
                Back
              </Button>
              <Button variant="destructive" onClick={handleConfirm}>
                Close Cycle
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Executing */}
      {step === "executing" && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-body-sm font-medium">Closing cycle...</span>
            </div>
            <Progress value={60} />
            <p className="text-caption text-muted-foreground">
              Processing records and creating new cycle. Please do not navigate away.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Done */}
      {step === "done" && result && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Alert className="border-success bg-success-surface text-success">
              <CheckCircle2 className="h-4 w-4" />
              Cycle closed successfully. A new cycle is now open.
            </Alert>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-md border p-4 text-center">
                <p className="text-2xl font-bold">{result.settledCount}</p>
                <p className="text-caption text-muted-foreground">Records Purged</p>
              </div>
              <div className="rounded-md border p-4 text-center">
                <p className="text-2xl font-bold">{result.unsettledCount}</p>
                <p className="text-caption text-muted-foreground">Cases Carried Forward</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
