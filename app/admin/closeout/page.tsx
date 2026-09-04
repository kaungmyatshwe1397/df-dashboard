// Admin closeout page — lock cycle, carry forward, delete month.

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
            Lock the cycle, carry forward unsettled cases, or delete month data.
          </p>
        </div>
        <CloseoutPanel />
      </div>
    </PortalLayout>
  );
}
