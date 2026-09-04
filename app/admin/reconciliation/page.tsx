"use client";

import { PortalLayout } from "@/components/layout/PortalLayout";
import { LabReconciliationTable } from "@/components/reconciliation";
import { useData } from "@/context/DataContext";

export default function ReconciliationPage() {
  const { cycleLocked } = useData();

  return (
    <PortalLayout requiredRole="ADMIN">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">Lab Fee Reconciliation</h1>
          <p className="text-muted-foreground">
            Assign lab fees to active Case treatments. Fees auto-aggregate for
            the financial dashboard.
          </p>
        </div>
        {cycleLocked && (
          <p className="text-sm text-muted-foreground">
            Cycle is locked — lab fees are read-only.
          </p>
        )}
        <LabReconciliationTable cycleLocked={cycleLocked} />
      </div>
    </PortalLayout>
  );
}
