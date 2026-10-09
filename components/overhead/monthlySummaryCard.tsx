// MonthlySummaryCard keeps the live total and save feedback visible while editing.

"use client";

import { Check, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface MonthlySummaryCardPropsType {
  month: string;
  total: number;
  canEdit: boolean;
  saving: boolean;
  saved: boolean;
  error: string | null;
  onSave: () => void;
}

function formatMMK(amount: number) {
  return `MMK ${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function MonthlySummaryCard({
  month,
  total,
  canEdit,
  saving,
  saved,
  error,
  onSave,
}: MonthlySummaryCardPropsType) {
  return (
    <Card size="sm" className="order-first lg:order-last lg:sticky lg:top-20">
      <CardHeader className="border-b border-border">
        <CardTitle>Monthly total</CardTitle>
        <CardDescription>{month} · updates as you edit</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <div aria-live="polite" aria-atomic="true">
          <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
            Estimated operating expenses
          </p>
          <p className="mt-2 text-h3 font-bold tabular-nums text-foreground">
            {formatMMK(total)}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Includes regular and additional expense items. Blank amounts count as zero.
        </p>

        <Separator />

        {error && <Alert variant="destructive">{error}</Alert>}
        {saved && (
          <p className="flex items-center gap-2 text-sm font-medium text-primary" role="status">
            <Check className="size-4" />
            Expenses saved for {month}.
          </p>
        )}

        {canEdit && (
          <Button onClick={onSave} disabled={saving} className="w-full" size="lg">
            {saving ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : saved ? (
              <Check className="mr-2 size-4" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            {saving ? "Saving expenses…" : "Save expenses"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
