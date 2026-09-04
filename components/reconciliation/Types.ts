// Types for LabReconciliationTable.
// Extracted to keep the main component focused on UI and data flow.

import { CasePatientRecordType } from "@/lib/global";

export interface LabGroup {
  labName: string;
  records: CasePatientRecordType[];
  totalFees: number;
}
