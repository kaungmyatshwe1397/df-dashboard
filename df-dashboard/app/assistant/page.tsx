"use client";

import { PortalLayout } from "@/components/layout/PortalLayout";

export default function AssistantPage() {
  return (
    <PortalLayout requiredRole="ASSISTANT">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">Record Table</h1>
          <p className="text-muted-foreground">
            View and manage patient records for the current cycle.
          </p>
        </div>
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          Record table will be built in Task 5.
        </div>
      </div>
    </PortalLayout>
  );
}
