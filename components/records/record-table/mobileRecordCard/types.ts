// Mobile record presentation receives the same data and actions as the desktop table.

import type { CasePatientRecordType, CasePayment, PatientRecord } from "@/lib/global";

export interface MobileRecordCardPropsType {
  rowNumber?: number;
  record: PatientRecord;
  totalPaid?: number;
  remaining?: number;
  payments?: CasePayment[];
  expanded?: boolean;
  onToggleHistory?: (id: string) => void;
  onEdit?: (record: PatientRecord) => void;
  onPay?: (record: CasePatientRecordType) => void;
}
