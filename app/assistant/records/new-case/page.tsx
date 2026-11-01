// Assistant Case entry shares the verified patient selection and retry-safe save flow.
"use client";

import { PortalLayout } from "@/components/layout/PortalLayout";
import { NewPatientRecord } from "@/components/records/newPatientRecord";
import { RecordCategory } from "@/lib/global";

export default function AssistantNewCaseRecordPage() {
  return <PortalLayout><NewPatientRecord listPath="/assistant" category={RecordCategory.CASE} /></PortalLayout>;
}
