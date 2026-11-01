// Assistant GP entry shares the same patient-ID checks and retry-safe visit save as admin entry.
"use client";

import { PortalLayout } from "@/components/layout/PortalLayout";
import { NewPatientRecord } from "@/components/records/newPatientRecord";
import { RecordCategory } from "@/lib/global";

export default function AssistantNewGpRecordPage() {
  return <PortalLayout><NewPatientRecord listPath="/assistant" category={RecordCategory.GP} /></PortalLayout>;
}
