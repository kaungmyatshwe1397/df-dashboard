"use client";

import { PortalLayout } from "@/components/layout/PortalLayout";

export default function AdminCloseoutPage() {
  return (
    <PortalLayout requiredRole="ADMIN">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">Month-End Closeout</h1>
          <p className="text-muted-foreground">
            Close the active cycle and carry forward unsettled cases.
          </p>
        </div>
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          Closeout wizard will be built in Task 10.
        </div>
      </div>
    </PortalLayout>
  );
}
