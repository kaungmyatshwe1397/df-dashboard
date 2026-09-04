// Types and helpers for PatientRecordUpdateForm.
// Extracted to keep the main component file focused on UI and orchestration.

import { RecordCategory, PatientRecord, CasePatientRecordType } from "@/lib/global";

export interface PatientRecordUpdateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory?: RecordCategory;
  editRecord?: PatientRecord | null;
  isAdding?: boolean;
}

export interface FormErrors {
  patientId?: string;
  patientName?: string;
  diagnosis?: string;
  caseType?: string;
  teeth?: string;
  totalCost?: string;
  labName?: string;
  paid?: string;
}

export function getInitialForm(record: PatientRecord) {
  const isCase = record.category === RecordCategory.CASE;
  const caseRecord = isCase ? (record as CasePatientRecordType) : null;
  return {
    patientId: record.patient_id,
    patientName: record.patient_name,
    address: record.address ?? "",
    diagnosis: record.diagnosis,
    caseType: caseRecord?.case_type ?? "",
    teeth: caseRecord?.teeth ?? "",
    totalCost: record.total_cost.toString(),
    labName: caseRecord?.lab_name ?? "",
    labSendDate: caseRecord?.lab_send_date ?? "",
    deliveryDate: caseRecord?.delivery_date ?? "",
    paid: caseRecord?.paid?.toString() ?? "",
  };
}
