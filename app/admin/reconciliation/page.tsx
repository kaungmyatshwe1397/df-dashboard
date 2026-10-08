"use client";

import Link from "next/link";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { LabReconciliationTable } from "@/components/reconciliation";
import { buttonVariants } from "@/components/ui/button";
import { useCanEdit } from "@/context/AuthContext";
import { Settings } from "lucide-react";

export default function ReconciliationPage() {
  const canEdit = useCanEdit();

  return (
    <PortalLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Lab Fee Reconciliation</h1>
            <p className="max-w-2xl text-muted-foreground">
              Assign lab fees to active Case treatments. Fees auto-aggregate for
              the financial dashboard.
            </p>
          </div>
          {canEdit && (
            <Link
              href="/admin/reconciliation/manage"
              className={buttonVariants({ variant: "outline" })}
            >
              <Settings className="mr-2 h-4 w-4" />
              Manage Labs & Cases
            </Link>
          )}
        </div>
        <LabReconciliationTable />
      </div>
    </PortalLayout>
  );
}
