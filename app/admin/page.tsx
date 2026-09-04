"use client";

import { PortalLayout } from "@/components/layout/PortalLayout";
import { DashboardKPIs } from "@/components/dashboard";

export default function AdminPage() {
  return (
    <PortalLayout requiredRole="ADMIN">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">Financial Dashboard</h1>
          <p className="text-muted-foreground">
            Live financial KPIs and clinic performance overview.
          </p>
        </div>
        <DashboardKPIs />
      </div>
    </PortalLayout>
  );
}
