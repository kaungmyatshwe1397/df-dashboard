// Closeout Panel — simple 2-action panel: Carry Forward, Delete Month.
// Delete action uses a confirmation dialog to prevent accidental data loss.

"use client";

import { useState } from "react";
import { ArrowRight, Trash2, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useData } from "@/context/DataContext";
import { RecordCategory } from "@/lib/global";

export function CloseoutPanel() {
  const { records, carryForward, deleteMonth, selectedMonth } = useData();
  const [loading, setLoading] = useState<"carry" | "delete" | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
    setDeleteDialogOpen(false);
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
    <div className="grid gap-3.5" style={{ gridTemplateColumns: "1fr 1fr" }}>
      {/* Carry Forward */}
      <div className="rounded-[14px] border border-border bg-card p-[18px]">
        <div className="flex justify-between items-start mb-3">
          <span className="text-xs text-muted-foreground">Carry Forward</span>
          <div className="w-[30px] h-[30px] rounded-lg bg-input flex items-center justify-center">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <p className="text-[13px] text-muted-foreground mb-3">
          Move unsettled cases to next month. {totalCount > 0 && `${unsettledCount} of ${totalCount} cases have remaining balance.`}
        </p>
        <Button
          onClick={handleCarryForward}
          disabled={loading !== null || unsettledCount === 0}
          variant="outline"
          size="sm"
          className="border-border text-foreground hover:bg-accent/10 hover:text-accent"
        >
          {loading === "carry" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="mr-2 h-4 w-4" />
          )}
          Carry Forward ({unsettledCount})
        </Button>
      </div>

      {/* Delete Month */}
      <div className="rounded-[14px] border border-border bg-card p-[18px]">
        <div className="flex justify-between items-start mb-3">
          <span className="text-xs text-muted-foreground">Delete Month</span>
          <div className="w-[30px] h-[30px] rounded-lg bg-danger-bg flex items-center justify-center">
            <Trash2 className="h-4 w-4 text-danger" />
          </div>
        </div>
        <div className="rounded-lg border border-danger/20 bg-danger-bg p-3 mb-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
            <p className="text-[13px] text-danger">
              This permanently deletes all {totalCount} record(s) for {selectedMonth}. This cannot be undone.
            </p>
          </div>
        </div>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogTrigger
            render={
              <Button
                variant="destructive"
                size="sm"
                disabled={loading !== null || totalCount === 0}
              />
            }
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete {selectedMonth}
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-danger" />
                Confirm Delete
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to permanently delete all {totalCount} record(s) for {selectedMonth}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                className="border-border"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteMonth}
                disabled={loading !== null}
              >
                {loading === "delete" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete Permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Result feedback */}
      {result && (
        <div className="col-span-2">
          <Alert className="border-accent/30 bg-accent-dark text-accent">
            <CheckCircle2 className="h-4 w-4" />
            {result}
          </Alert>
        </div>
      )}
    </div>
  );
}
