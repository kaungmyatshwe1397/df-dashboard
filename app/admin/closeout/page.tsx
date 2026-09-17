// Admin closeout page — carry forward unsettled cases, or delete month data.

"use client";

import { PortalLayout } from "@/components/layout/PortalLayout";
import { CloseoutPanel } from "@/components/closeout/CloseoutPanel";

export default function CloseoutPage() {
  return (
      <PortalLayout>
      <div>
        <h1 className="text-[26px] font-bold text-foreground m-0 mb-1">Month-End Closeout</h1>
        <p className="text-[13px] text-muted-foreground m-0 mb-7">
          Carry forward unsettled cases to the next month, or delete all records for the current month.
        </p>
        <CloseoutPanel />
      </div>
    </PortalLayout>
  );
}
