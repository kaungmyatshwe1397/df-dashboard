// Admin closeout page — 2-step wizard to close the current cycle.
// Settled records are purged, unsettled cases carry forward to a new cycle.

"use client";

import { PortalLayout } from "@/components/layout/PortalLayout";
import { CloseoutWizard } from "@/components/closeout/CloseoutWizard";

export default function CloseoutPage() {
  return (
    <PortalLayout requiredRole="ADMIN">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">Month-End Closeout</h1>
          <p className="text-muted-foreground">
            Close the current cycle. Settled records are purged; unpaid cases carry forward.
          </p>
        </div>
        <CloseoutWizard />
      </div>
    </PortalLayout>
  );
}
