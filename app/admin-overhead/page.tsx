"use client";

import { PortalLayout } from "@/components/layout/PortalLayout";

export default function AdminOverheadPage() {
  return (
    <PortalLayout requiredRole="ADMIN">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">Monthly Overhead & Expenses</h1>
          <p className="text-muted-foreground">
            Enter monthly operating expenses for the active cycle.
          </p>
        </div>
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          Overhead form will be built in Task 9.
        </div>
      </div>
    </PortalLayout>
  );
}
