"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  MonthlyCycle,
  PatientRecord,
  CasePayment,
  MonthlyFinancials,
  CycleStatus,
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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const records = MOCK_PATIENT_RECORDS;
  const payments = MOCK_CASE_PAYMENTS;

  const cycle = MOCK_CYCLES.find((c) => c.status === CycleStatus.OPEN) ?? null;
  const financials = cycle
    ? MOCK_MONTHLY_FINANCIALS.find((f) => f.cycle_id === cycle.id) ?? null
    : null;
  const cycleLocked = cycle?.status === CycleStatus.CLOSED;

  const activeRecords = cycle
    ? records.filter((r) => r.cycle_id === cycle.id)
    : [];

  const getPaymentsForRecord = useCallback(
    (recordId: string) => payments.filter((p) => p.record_id === recordId),
    [payments]
  );

  const getRecordTotalPaid = useCallback(
    (recordId: string) =>
      payments
        .filter((p) => p.record_id === recordId)
        .reduce((sum, p) => sum + p.paid_amount, 0),
    [payments]
  );

  const getRecordBalance = useCallback(
    (record: PatientRecord) => {
      const totalPaid = getRecordTotalPaid(record.id);
      return record.total_cost - totalPaid;
    },
    [getRecordTotalPaid]
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
        payments,
        financials,
        cycleLocked,
        loading,
        error,
        getPaymentsForRecord,
        getRecordBalance,
        getRecordTotalPaid,
        refreshData,
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
