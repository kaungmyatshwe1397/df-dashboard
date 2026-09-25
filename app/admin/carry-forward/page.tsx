// Carry Forward page — move unsettled CASE balances into the next month.

"use client";

import { PortalLayout } from "@/components/layout/PortalLayout";
import { CarryForwardPanel } from "@/components/carryForward/CarryForwardPanel";

export default function CarryForwardPage() {
  return (
    <PortalLayout>
      <div>
        <h1 className="text-[26px] font-bold text-foreground m-0 mb-1">Carry Forward</h1>
        <p className="text-[13px] text-muted-foreground m-0 mb-7">
          Move unsettled case balances from this month into the next month.
        </p>
        <CarryForwardPanel />
      </div>
    </PortalLayout>
  );
}
