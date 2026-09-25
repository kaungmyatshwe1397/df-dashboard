// Types and helpers for PatientRecordUpdateForm.
// Extracted to keep the main component file focused on UI and orchestration.

import {
  RecordCategory,
  PatientRecord,
  CasePatientRecordType,
  PatientType,
  Gender,
} from "@/lib/global";

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
  age?: string;
  diagnosis?: string;
  caseType?: string;
  teeth?: string;
  totalCost?: string;
  labName?: string;
  paid?: string;
}

// Full controlled form state: identity + demographics + treatment.
// Demographics live only on the patients table — never on records.
export interface FormState {
  patientId: string;
  patientName: string;
  address: string;
  age: string;
  gender: string;
  drugAllergy: string;
  pastDentalHistory: string;
  pastMedicalHistory: string[];
  currentMedications: string[];
  diagnosis: string;
  caseType: string;
  teeth: string;
  totalCost: string;
  labName: string;
  labSendDate: string;
  deliveryDate: string;
  paid: string;
}

export function getEmptyForm(): FormState {
  return {
    patientId: "",
    patientName: "",
    address: "",
    age: "",
    gender: Gender.MALE,
    drugAllergy: "",
    pastDentalHistory: "",
    pastMedicalHistory: [],
    currentMedications: [],
    diagnosis: "",
    caseType: "",
    teeth: "",
    totalCost: "",
    labName: "",
    labSendDate: "",
    deliveryDate: "",
    paid: "",
  };
}

export function getInitialForm(
  record: PatientRecord,
  patient: PatientType | null
): FormState {
  const isCase = record.category === RecordCategory.CASE;
  const caseRecord = isCase ? (record as CasePatientRecordType) : null;
  return {
    patientId: record.patient_id,
    patientName: patient?.patient_name ?? record.patient_name,
    address: patient?.address ?? record.address ?? "",
    age: patient ? String(patient.age) : "",
    gender: patient?.gender ?? Gender.MALE,
    drugAllergy: patient?.drug_allergy ?? "",
    pastDentalHistory: patient?.past_dental_history ?? "",
    pastMedicalHistory: patient ? [...patient.past_medical_history] : [],
    currentMedications: patient ? [...patient.current_medications] : [],
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
