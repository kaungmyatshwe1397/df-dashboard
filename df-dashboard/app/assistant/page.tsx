"use client";

import { PortalLayout } from "@/components/layout/PortalLayout";
import { RecordTable } from "@/components/RecordTable";

export default function AssistantPage() {
  return (
    <PortalLayout requiredRole="ASSISTANT">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-h2 font-bold">Record Table</h1>
          <p className="text-body-sm text-muted-foreground">
            View and manage patient records for the current cycle.
          </p>
        </div>
        <RecordTable onAdd={() => {}} />
      </div>
    </PortalLayout>
  );
}
