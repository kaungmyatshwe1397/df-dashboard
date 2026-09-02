"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  MonthlyCycle,
  PatientRecord,
  CasePayment,
  MonthlyFinancials,
  CycleStatus,
  RecordCategory,
  PaymentStatus,
} from "@/lib/global";
import {
  MOCK_CYCLES,
  MOCK_PATIENT_RECORDS,
  MOCK_CASE_PAYMENTS,
  MOCK_MONTHLY_FINANCIALS,
} from "@/lib/mock-data";

interface DataContextType {
  cycle: MonthlyCycle | null;
  records: PatientRecord[];
  payments: CasePayment[];
  financials: MonthlyFinancials | null;
  cycleLocked: boolean;
  loading: boolean;
  error: string | null;
  getPaymentsForRecord: (recordId: string) => CasePayment[];
  getRecordBalance: (record: PatientRecord) => number;
  getRecordTotalPaid: (recordId: string) => number;
  refreshData: () => void;
  addRecord: (record: Omit<PatientRecord, "id" | "cycle_id" | "entry_date" | "is_carried_forward">, initialPayment?: number) => void;
  updateRecord: (recordId: string, updates: Partial<PatientRecord>) => void;
  addPayment: (payment: Omit<CasePayment, "id" | "payment_date">) => void;
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
    },
    []
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
        cycleLocked,
        loading,
        error,
        getPaymentsForRecord,
        getRecordBalance,
        getRecordTotalPaid,
        refreshData,
        addRecord,
        updateRecord,
        addPayment,
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
