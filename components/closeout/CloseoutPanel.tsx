// Closeout Panel — simple 3-action panel: Lock, Carry Forward, Delete Month.
// Replaces the old CloseoutWizard with a streamlined flow.

"use client";

import { useState } from "react";
import { Lock, Unlock, ArrowRight, Trash2, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/context/DataContext";
import { RecordCategory } from "@/lib/global";

export function CloseoutPanel() {
  const { records, cycleLocked, toggleLock, carryForward, deleteMonth, selectedMonth } = useData();
  const [loading, setLoading] = useState<"lock" | "carry" | "delete" | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const unsettledRecords = records.filter(
    (r) => r.category === RecordCategory.CASE && (r.remaining ?? 0) > 0
  );
  const totalCount = records.length;
  const unsettledCount = unsettledRecords.length;

  function handleToggleLock() {
    setLoading("lock");
    setResult(null);
    setTimeout(() => {
      toggleLock();
      setLoading(null);
      setResult(cycleLocked ? "Cycle unlocked." : "Cycle locked. Assistant has read-only access.");
    }, 300);
  }

  function handleCarryForward() {
    setLoading("carry");
    setResult(null);
    setTimeout(() => {
      const { carriedCount } = carryForward();
      setLoading(null);
      setResult(carriedCount > 0
        ? `${carriedCount} case(s) carried forward to next month.`
        : "No unsettled cases to carry forward.");
    }, 300);
  }

  function handleDeleteMonth() {
    setLoading("delete");
    setResult(null);
    setTimeout(() => {
      const count = deleteMonth();
      setLoading(null);
      setResult(`${count} record(s) for ${selectedMonth} permanently deleted.`);
    }, 300);
  }

  return (
    <div className="space-y-4">
      {/* Lock / Unlock */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {cycleLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            Cycle Lock
            <Badge variant={cycleLocked ? "destructive" : "default"}>
              {cycleLocked ? "Locked" : "Unlocked"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            {cycleLocked
              ? "Cycle is locked. Assistant has read-only access."
              : "Cycle is unlocked. Assistant can edit records."}
          </p>
          <Button
            onClick={handleToggleLock}
            disabled={loading !== null}
            variant={cycleLocked ? "outline" : "default"}
            size="sm"
          >
            {loading === "lock" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : cycleLocked ? (
              <Unlock className="mr-2 h-4 w-4" />
            ) : (
              <Lock className="mr-2 h-4 w-4" />
            )}
            {cycleLocked ? "Unlock Cycle" : "Lock Cycle"}
          </Button>
        </CardContent>
      </Card>

      {/* Carry Forward */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Carry Forward
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Move unsettled cases to next month. {totalCount > 0 && `${unsettledCount} of ${totalCount} cases have remaining balance.`}
          </p>
          <Button
            onClick={handleCarryForward}
            disabled={loading !== null || unsettledCount === 0}
            variant="outline"
            size="sm"
          >
            {loading === "carry" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="mr-2 h-4 w-4" />
            )}
            Carry Forward ({unsettledCount})
          </Button>
        </CardContent>
      </Card>

      {/* Delete Month */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
            <Trash2 className="h-4 w-4" />
            Delete Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-3">
            <AlertTriangle className="h-4 w-4" />
            This permanently deletes all {totalCount} record(s) for {selectedMonth}. This cannot be undone.
          </Alert>
          <Button
            onClick={handleDeleteMonth}
            disabled={loading !== null || totalCount === 0}
            variant="destructive"
            size="sm"
          >
            {loading === "delete" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete {selectedMonth}
          </Button>
        </CardContent>
      </Card>

      {/* Result feedback */}
      {result && (
        <Alert className="border-success bg-success-surface text-success">
          <CheckCircle2 className="h-4 w-4" />
          {result}
        </Alert>
      )}
    </div>
  );
}
