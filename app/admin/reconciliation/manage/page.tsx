"use client";

import Link from "next/link";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { LabTable, CaseTypeTable } from "@/components/reconciliation/manage";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";

export default function ManageLabsCaseTypesPage() {
  return (
    <PortalLayout requiredRole="ADMIN">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <Link
            href="/admin/reconciliation"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reconciliation
          </Link>

          <div>
            <h1 className="text-2xl font-bold">Manage Labs & Case Types</h1>
            <p className="text-muted-foreground">
              Add, edit, or remove labs and case type options used across the
              system.
            </p>
          </div>
        </div>

        <LabTable />

        <Separator />

        <CaseTypeTable />
      </div>
    </PortalLayout>
  );
}
