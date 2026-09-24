// Carry Forward Panel — moves unsettled CASE balances to the next month.
// The only remaining month-boundary action (lock/close/purge removed).

"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useData } from "@/context/DataContext";
import { RecordCategory } from "@/lib/global";

export function CarryForwardPanel() {
  const { records, carryForward } = useData();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const unsettledCount = records.filter(
    (r) => r.category === RecordCategory.CASE && (r.remaining ?? 0) > 0
  ).length;
  const totalCount = records.length;

  async function handleCarryForward() {
    setLoading(true);
    setResult(null);
    try {
      const { carriedCount } = await carryForward();
      setResult(carriedCount > 0
        ? `${carriedCount} case(s) carried forward to next month.`
        : "No unsettled cases to carry forward.");
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Failed to carry forward.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-3.5 max-w-xl">
      <div className="rounded-[14px] border border-border bg-card p-[18px]">
        <div className="flex justify-between items-start mb-3">
          <span className="text-xs text-muted-foreground">Carry Forward</span>
          <div className="w-[30px] h-[30px] rounded-lg bg-input flex items-center justify-center">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <p className="text-[13px] text-muted-foreground mb-3">
          Move unsettled cases to next month.{" "}
          {totalCount > 0 && `${unsettledCount} of ${totalCount} cases have remaining balance.`}
        </p>
        <Button
          onClick={handleCarryForward}
          disabled={loading || unsettledCount === 0}
          variant="outline"
          size="sm"
          className="border-border text-foreground hover:bg-accent/10 hover:text-accent"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="mr-2 h-4 w-4" />
          )}
          Carry Forward ({unsettledCount})
        </Button>
      </div>

      {result && (
        <Alert className="border-accent/30 bg-accent-dark text-accent">
          <CheckCircle2 className="h-4 w-4" />
          {result}
        </Alert>
      )}
    </div>
  );
}
