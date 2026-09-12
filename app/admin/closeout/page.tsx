// Admin closeout page — carry forward unsettled cases, or delete month data.

"use client";

import { PortalLayout } from "@/components/layout/PortalLayout";
import { CloseoutPanel } from "@/components/closeout/CloseoutPanel";

export default function CloseoutPage() {
  return (
    <PortalLayout requiredRole="ADMIN">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">Month-End Closeout</h1>
          <p className="text-muted-foreground">
            Carry forward unsettled cases to the next month, or delete all records for the current month.
          </p>
        </div>
        <CloseoutPanel />
      </div>
    </PortalLayout>
  );
}
