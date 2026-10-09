// Admin overhead page — form for entering monthly operating expenses.
// Changes saved here instantly update the Dashboard KPIs.

"use client";

import { PortalLayout } from "@/components/layout/PortalLayout";
import { OverheadForm } from "@/components/overhead/OverheadForm";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/context/DataContext";
import { ReceiptText } from "lucide-react";

export default function OverheadPage() {
  const { selectedMonth } = useData();

  return (
    <PortalLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ReceiptText className="size-6" />
            </span>
            <div className="space-y-1">
              <h1 className="text-h2 font-bold text-foreground">
                Overhead &amp; Expenses
              </h1>
              <p className="text-muted-foreground">
                Track operating costs and keep your monthly financials up to date.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="w-fit sm:ml-auto">
            {selectedMonth}
          </Badge>
        </div>
        <OverheadForm />
      </div>
    </PortalLayout>
  );
}
