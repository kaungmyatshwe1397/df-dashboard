// Admin Case entry uses the shared identity check while preserving Case treatment and payment fields.
"use client";

import { PortalLayout } from "@/components/layout/PortalLayout";
import { NewPatientRecord } from "@/components/records/newPatientRecord";
import { RecordCategory } from "@/lib/global";

export default function AdminNewCaseRecordPage() {
  return <PortalLayout><NewPatientRecord listPath="/admin/records" category={RecordCategory.CASE} /></PortalLayout>;
}
