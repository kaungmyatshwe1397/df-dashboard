"use client";

import { PortalLayout } from "@/components/layout/PortalLayout";

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
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          Financial dashboard will be built in Task 7.
        </div>
      </div>
    </PortalLayout>
  );
}
