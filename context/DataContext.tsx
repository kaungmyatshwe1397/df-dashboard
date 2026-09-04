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
  CasePatientRecordType,
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
  updateFinancials: (updates: Partial<Omit<MonthlyFinancials, "id" | "cycle_id">>) => void;
  closeoutCycle: () => { settledCount: number; unsettledCount: number };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allRecords, setAllRecords] = useState<PatientRecord[]>(MOCK_PATIENT_RECORDS);
  const [allPayments, setAllPayments] = useState<CasePayment[]>(MOCK_CASE_PAYMENTS);
  const [allFinancials, setAllFinancials] = useState<MonthlyFinancials[]>(MOCK_MONTHLY_FINANCIALS);
  const [allCycles, setAllCycles] = useState<MonthlyCycle[]>(MOCK_CYCLES);

  const cycle = allCycles.find((c) => c.status === CycleStatus.OPEN) ?? null;
  const financials = cycle
    ? allFinancials.find((f) => f.cycle_id === cycle.id) ?? null
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

      const baseFields = {
        id: `rec-${Date.now()}`,
        cycle_id: cycle.id,
        entry_date: new Date().toISOString().split("T")[0],
      };

      // GP and Case have different shapes — conditionally add is_carried_forward.
      const newRecord = recordData.category === RecordCategory.CASE
        ? { ...recordData, ...baseFields, is_carried_forward: false }
        : { ...recordData, ...baseFields };

      setAllRecords((prev) => [...prev, newRecord as PatientRecord]);

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
        prev.map((r) => (r.id === recordId ? { ...r, ...updates } as PatientRecord : r))
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

      // Sync parent record's paid and remaining fields (Case records only).
      setAllRecords((prev) =>
        prev.map((r) => {
          if (r.id !== paymentData.record_id) return r;
          if (r.category !== RecordCategory.CASE) return r;
          const caseRec = r as CasePatientRecordType;
          const newTotalPaid = (caseRec.paid ?? 0) + paymentData.paid_amount;
          return {
            ...caseRec,
            paid: newTotalPaid,
            remaining: caseRec.total_cost - newTotalPaid,
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

  const updateFinancials = useCallback(
    (updates: Partial<Omit<MonthlyFinancials, "id" | "cycle_id">>) => {
      if (!cycle) return;

      setAllFinancials((prev) => {
        const existing = prev.find((f) => f.cycle_id === cycle.id);
        if (existing) {
          return prev.map((f) =>
            f.cycle_id === cycle.id ? { ...f, ...updates } : f
          );
        }
        // Create new record if none exists for this cycle
        const newFinancials: MonthlyFinancials = {
          id: `fin-${Date.now()}`,
          cycle_id: cycle.id,
          total_gp: 0,
          total_case: 0,
          gross_income: 0,
          lab_fee: 0,
          relieving_fee: 0,
          general_expenses: 0,
          assistant_fee: 0,
          bonus: 0,
          utility_costs: 0,
          building_rent: 0,
          net_profit: 0,
          ...updates,
        };
        return [...prev, newFinancials];
      });
    },
    [cycle]
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

  const closeoutCycle = useCallback(() => {
    if (!cycle) return { settledCount: 0, unsettledCount: 0 };

    // Partition records: settled = GP + fully paid Case, unsettled = Case with remaining balance
    const settledRecords = activeRecords.filter(
      (r) =>
        r.category === RecordCategory.GP ||
        (r.category === RecordCategory.CASE && (r.remaining ?? 0) <= 0)
    );
    const unsettledRecords = activeRecords.filter(
      (r) =>
        r.category === RecordCategory.CASE && (r.remaining ?? 0) > 0
    );

    const settledIds = new Set(settledRecords.map((r) => r.id));

    // Remove settled records and their associated payments
    setAllRecords((prev) => prev.filter((r) => !settledIds.has(r.id)));
    setAllPayments((prev) => prev.filter((p) => !settledIds.has(p.record_id)));

    // Compute next month for new cycle (increment month by 1)
    const [year, month] = cycle.month_year.split("-").map(Number);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const newCycleId = `cycle-${Date.now()}`;
    const newCycle: MonthlyCycle = {
      id: newCycleId,
      month_year: `${nextYear}-${String(nextMonth).padStart(2, "0")}`,
      status: CycleStatus.OPEN,
    };

    // Migrate unsettled cases to new cycle and mark as carried forward
    const unsettledIds = new Set(unsettledRecords.map((r) => r.id));
    setAllRecords((prev) =>
      prev.map((r) => {
        if (!unsettledIds.has(r.id)) return r;
        return { ...r, cycle_id: newCycleId, is_carried_forward: true };
      })
    );
    setAllPayments((prev) =>
      prev.map((p) => {
        if (!unsettledIds.has(p.record_id)) return p;
        return p;
      })
    );

    // Close old cycle and add new cycle
    setAllCycles((prev) => [
      ...prev.map((c) =>
        c.id === cycle.id ? { ...c, status: CycleStatus.CLOSED } : c
      ),
      newCycle,
    ]);

    return {
      settledCount: settledRecords.length,
      unsettledCount: unsettledRecords.length,
    };
  }, [cycle, activeRecords]);

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
        updateFinancials,
        closeoutCycle,
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
