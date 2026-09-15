"use client";

import { PortalLayout } from "@/components/layout/PortalLayout";
import { DashboardKPIs } from "@/components/dashboard";

export default function AdminPage() {
  return (
    <PortalLayout requiredRole="ADMIN">
      <div className="flex justify-between items-end mb-7">
        <div>
          <h1 className="text-[26px] font-bold text-foreground m-0 mb-1">Financial overview</h1>
          <p className="text-[13px] text-muted-foreground m-0">
            Live KPIs and clinic performance, this cycle.
          </p>
        </div>
        <div className="bg-input border border-border text-muted-foreground text-[13px] px-3.5 py-2 rounded-lg">
          This month ▾
        </div>
      </div>
      <DashboardKPIs />
    </PortalLayout>
  );
}
