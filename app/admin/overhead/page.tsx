// Admin overhead page — form for entering monthly operating expenses.
// Changes saved here instantly update the Dashboard KPIs.

"use client";

import { PortalLayout } from "@/components/layout/PortalLayout";
import { OverheadForm } from "@/components/overhead/OverheadForm";

export default function OverheadPage() {
  return (
    <PortalLayout requiredRole="ADMIN">
      <div>
        <h1 className="text-[26px] font-bold text-foreground m-0 mb-1">Overhead & Expenses</h1>
        <p className="text-[13px] text-muted-foreground m-0 mb-7">
          Enter monthly operating costs. Saved values update the dashboard in real time.
        </p>
        <OverheadForm />
      </div>
    </PortalLayout>
  );
}
