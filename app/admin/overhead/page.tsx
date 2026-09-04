// Admin overhead page — form for entering monthly operating expenses.
// Changes saved here instantly update the Dashboard KPIs.

"use client";

import { PortalLayout } from "@/components/layout/PortalLayout";
import { OverheadForm } from "@/components/overhead/OverheadForm";

export default function OverheadPage() {
  return (
    <PortalLayout requiredRole="ADMIN">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">Overhead & Expenses</h1>
          <p className="text-muted-foreground">
            Enter monthly operating costs. Saved values update the dashboard in real time.
          </p>
        </div>
        <OverheadForm />
      </div>
    </PortalLayout>
  );
}
