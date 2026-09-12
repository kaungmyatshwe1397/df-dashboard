// Closeout Panel — simple 2-action panel: Carry Forward, Delete Month.

"use client";

import { useState } from "react";
import { ArrowRight, Trash2, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useData } from "@/context/DataContext";
import { RecordCategory } from "@/lib/global";

export function CloseoutPanel() {
  const { records, carryForward, deleteMonth, selectedMonth } = useData();
  const [loading, setLoading] = useState<"carry" | "delete" | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const unsettledRecords = records.filter(
    (r) => r.category === RecordCategory.CASE && (r.remaining ?? 0) > 0
  );
  const totalCount = records.length;
  const unsettledCount = unsettledRecords.length;

  async function handleCarryForward() {
    setLoading("carry");
    setResult(null);
    try {
      const { carriedCount } = await carryForward();
      setResult(carriedCount > 0
        ? `${carriedCount} case(s) carried forward to next month.`
        : "No unsettled cases to carry forward.");
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Failed to carry forward.");
    } finally {
      setLoading(null);
    }
  }

  async function handleDeleteMonth() {
    setLoading("delete");
    setResult(null);
    try {
      const count = await deleteMonth();
      setResult(`${count} record(s) for ${selectedMonth} permanently deleted.`);
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Failed to delete month.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
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
