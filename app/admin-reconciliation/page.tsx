"use client";

import { PortalLayout } from "@/components/layout/PortalLayout";

export default function AdminReconciliationPage() {
  return (
    <PortalLayout requiredRole="ADMIN">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">Case & Lab Fee Reconciliation</h1>
          <p className="text-muted-foreground">
            Assign lab fees to active Case treatments.
          </p>
        </div>
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          Lab reconciliation table will be built in Task 8.
        </div>
      </div>
    </PortalLayout>
  );
}
