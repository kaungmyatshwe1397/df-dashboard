// Admin GP entry uses the shared full-page form so visit creation remains consistent across roles.
"use client";

import { PortalLayout } from "@/components/layout/PortalLayout";
import { NewPatientRecord } from "@/components/records/newPatientRecord";
import { RecordCategory } from "@/lib/global";

export default function AdminNewGpRecordPage() {
  return <PortalLayout><NewPatientRecord listPath="/admin/records" category={RecordCategory.GP} /></PortalLayout>;
}
