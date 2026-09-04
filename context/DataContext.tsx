"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  MonthlyCycle,
  PatientRecord,
  CasePayment,
  MonthlyFinancials,
  Lab,
  CaseType,
  CycleStatus,
  RecordCategory,
  PaymentStatus,
} from "@/lib/global";
import {
  MOCK_CYCLES,
  MOCK_PATIENT_RECORDS,
  MOCK_CASE_PAYMENTS,
  MOCK_MONTHLY_FINANCIALS,
  MOCK_LABS,
  MOCK_CASE_TYPES,
} from "@/lib/mock-data";

interface DataContextType {
  cycle: MonthlyCycle | null;
  records: PatientRecord[];
  payments: CasePayment[];
  financials: MonthlyFinancials | null;
  labs: Lab[];
  caseTypes: CaseType[];
  cycleLocked: boolean;
  loading: boolean;
  error: string | null;
  getPaymentsForRecord: (recordId: string) => CasePayment[];
  getRecordBalance: (record: PatientRecord) => number;
  getRecordTotalPaid: (recordId: string) => number;
  refreshData: () => void;
  addRecord: (record: Omit<PatientRecord, "id" | "cycle_id" | "entry_date" | "is_carried_forward">, initialPayment?: number) => void;
  updateRecord: (recordId: string, updates: Partial<PatientRecord>) => void;
  deleteRecord: (recordId: string) => void;
  addPayment: (payment: Omit<CasePayment, "id" | "payment_date">) => void;
  findRecordByPatientId: (patientId: string, category?: RecordCategory) => PatientRecord | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allRecords, setAllRecords] = useState<PatientRecord[]>(MOCK_PATIENT_RECORDS);
  const [allPayments, setAllPayments] = useState<CasePayment[]>(MOCK_CASE_PAYMENTS);

  const cycle = MOCK_CYCLES.find((c) => c.status === CycleStatus.OPEN) ?? null;
  const financials = cycle
    ? MOCK_MONTHLY_FINANCIALS.find((f) => f.cycle_id === cycle.id) ?? null
    : null;
  const cycleLocked = cycle?.status === CycleStatus.CLOSED;

  const activeRecords = cycle
    ? allRecords.filter((r) => r.cycle_id === cycle.id)
    : [];

  const getPaymentsForRecord = useCallback(
    (recordId: string) => allPayments.filter((p) => p.record_id === recordId),
    [allPayments]
  );

  const getRecordTotalPaid = useCallback(
    (recordId: string) =>
      allPayments
        .filter((p) => p.record_id === recordId)
        .reduce((sum, p) => sum + p.paid_amount, 0),
    [allPayments]
  );

  const getRecordBalance = useCallback(
    (record: PatientRecord) => {
      const totalPaid = getRecordTotalPaid(record.id);
      return record.total_cost - totalPaid;
    },
    [getRecordTotalPaid]
  );

  const addRecord = useCallback(
    (
      recordData: Omit<PatientRecord, "id" | "cycle_id" | "entry_date" | "is_carried_forward">,
      initialPayment?: number
    ) => {
      if (!cycle) return;

      const newRecord: PatientRecord = {
        ...recordData,
        id: `rec-${Date.now()}`,
        cycle_id: cycle.id,
        entry_date: new Date().toISOString().split("T")[0],
        is_carried_forward: false,
      };

      setAllRecords((prev) => [...prev, newRecord]);

      if (recordData.category === RecordCategory.CASE && initialPayment !== undefined && initialPayment > 0) {
        const newPayment: CasePayment = {
          id: `pay-${Date.now()}`,
          record_id: newRecord.id,
          payment_date: new Date().toISOString().split("T")[0],
          paid_amount: initialPayment,
          payment_note: "Initial payment",
          payment_status: PaymentStatus.PAID,
        };
        setAllPayments((prev) => [...prev, newPayment]);
      }
    },
    [cycle]
  );

  const updateRecord = useCallback(
    (recordId: string, updates: Partial<PatientRecord>) => {
      setAllRecords((prev) =>
        prev.map((r) => (r.id === recordId ? { ...r, ...updates } : r))
      );
    },
    []
  );

  const addPayment = useCallback(
    (paymentData: Omit<CasePayment, "id" | "payment_date">) => {
      const newPayment: CasePayment = {
        ...paymentData,
        id: `pay-${Date.now()}`,
        payment_date: new Date().toISOString().split("T")[0],
      };
      setAllPayments((prev) => [...prev, newPayment]);

      // Sync parent record's paid and remaining fields
      setAllRecords((prev) =>
        prev.map((r) => {
          if (r.id !== paymentData.record_id) return r;
          const newTotalPaid =
            (r.paid ?? 0) + paymentData.paid_amount;
          return {
            ...r,
            paid: newTotalPaid,
            remaining: r.total_cost - newTotalPaid,
          };
        })
      );
    },
    []
  );

  const deleteRecord = useCallback(
    // Also removes associated payments to prevent orphaned records.
    (recordId: string) => {
      setAllRecords((prev) => prev.filter((r) => r.id !== recordId));
      setAllPayments((prev) => prev.filter((p) => p.record_id !== recordId));
    },
    []
  );

  const findRecordByPatientId = useCallback(
    // Search is scoped to category so GP and Case tabs don't cross-match
    // when a patient has records in both types.
    (patientId: string, category?: RecordCategory) =>
      activeRecords.find(
        (r) =>
          r.patient_id === patientId.trim() &&
          (category ? r.category === category : true)
      ),
    [activeRecords]
  );

  const refreshData = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  return (
    <DataContext.Provider
      value={{
        cycle,
        records: activeRecords,
        payments: allPayments,
        financials,
        labs: MOCK_LABS,
        caseTypes: MOCK_CASE_TYPES,
        cycleLocked,
        loading,
        error,
        getPaymentsForRecord,
        getRecordBalance,
        getRecordTotalPaid,
        refreshData,
        addRecord,
        updateRecord,
        deleteRecord,
        addPayment,
        findRecordByPatientId,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
