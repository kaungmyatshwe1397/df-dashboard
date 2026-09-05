"use client";

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";
import {
  MonthlyCycle,
  PatientRecord,
  CasePayment,
  MonthlyFinancials,
  CustomOverhead,
  Lab,
  CaseType,
  User,
  UserRole,
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
  MOCK_USERS,
} from "@/lib/mock-data";

interface DataContextType {
  cycle: MonthlyCycle | null;
  records: PatientRecord[];
  payments: CasePayment[];
  financials: MonthlyFinancials | null;
  labs: Lab[];
  caseTypes: CaseType[];
  users: User[];
  cycleLocked: boolean;
  loading: boolean;
  error: string | null;
  allMonths: string[];
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  getPaymentsForRecord: (recordId: string) => CasePayment[];
  getRecordBalance: (record: PatientRecord) => number;
  getRecordTotalPaid: (recordId: string) => number;
  refreshData: () => void;
  addRecord: (record: Omit<PatientRecord, "id" | "cycle_id" | "entry_date" | "is_carried_forward" | "month_label">, initialPayment?: number) => void;
  updateRecord: (recordId: string, updates: Partial<PatientRecord>) => void;
  deleteRecord: (recordId: string) => void;
  addPayment: (payment: Omit<CasePayment, "id" | "payment_date">) => void;
  findRecordByPatientId: (patientId: string, category?: RecordCategory) => PatientRecord | undefined;
  updateFinancials: (updates: Partial<Omit<MonthlyFinancials, "id" | "cycle_id">>) => void;
  addCustomOverhead: (item: Omit<CustomOverhead, "id">) => void;
  removeCustomOverhead: (itemId: string) => void;
  toggleLock: () => void;
  carryForward: () => { carriedCount: number };
  deleteMonth: () => number;
  addUser: (user: { username: string; password: string; role: UserRole }) => boolean;
  updateUser: (userId: string, updates: { username?: string; password?: string }) => boolean;
  deleteUser: (userId: string) => boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function getMonthLabel(monthYear: string): string {
  const [year, month] = monthYear.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

function getNextMonthLabel(current: string): string {
  const [year, month] = current.split("-").map(Number);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allRecords, setAllRecords] = useState<PatientRecord[]>(MOCK_PATIENT_RECORDS);
  const [allPayments, setAllPayments] = useState<CasePayment[]>(MOCK_CASE_PAYMENTS);
  const [allFinancials, setAllFinancials] = useState<MonthlyFinancials[]>(MOCK_MONTHLY_FINANCIALS);
  const [allCycles, setAllCycles] = useState<MonthlyCycle[]>(MOCK_CYCLES);
  const [users, setUsers] = useState<User[]>(MOCK_USERS.map((u) => ({ ...u })));
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  const cycle = allCycles.find((c) => c.status === CycleStatus.OPEN) ?? null;
  const financials = cycle
    ? allFinancials.find((f) => f.cycle_id === cycle.id) ?? null
    : null;
  const cycleLocked = cycle?.status === CycleStatus.LOCKED;

  // All months that have records, sorted newest first.
  const allMonths = useMemo(() => {
    const months = new Set(allRecords.map((r) => r.month_label));
    return Array.from(months).sort((a, b) => {
      const [aYear, aMonth] = a.split(" ");
      const [bYear, bMonth] = b.split(" ");
      const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const aIdx = monthOrder.indexOf(aMonth);
      const bIdx = monthOrder.indexOf(bMonth);
      if (aYear !== bYear) return parseInt(bYear) - parseInt(aYear);
      return bIdx - aIdx;
    });
  }, [allRecords]);

  // Set default selected month to current cycle's month if not set.
  const effectiveMonth = selectedMonth || (cycle ? getMonthLabel(cycle.month_year) : allMonths[0] ?? "");

  // Records filtered by selected month.
  const activeRecords = useMemo(
    () => allRecords.filter((r) => r.month_label === effectiveMonth),
    [allRecords, effectiveMonth]
  );

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
      recordData: Omit<PatientRecord, "id" | "cycle_id" | "entry_date" | "is_carried_forward" | "month_label">,
      initialPayment?: number
    ) => {
      if (!cycle) return;

      const monthLabel = getMonthLabel(cycle.month_year);
      const baseFields = {
        id: `rec-${Date.now()}`,
        cycle_id: cycle.id,
        entry_date: new Date().toISOString().split("T")[0],
        month_label: monthLabel,
      };

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
          custom_overheads: [],
          ...updates,
        };
        return [...prev, newFinancials];
      });
    },
    [cycle]
  );

  const addCustomOverhead = useCallback(
    (item: Omit<CustomOverhead, "id">) => {
      if (!cycle) return;

      const newItem: CustomOverhead = {
        ...item,
        id: `co-${Date.now()}`,
      };

      setAllFinancials((prev) => {
        const existing = prev.find((f) => f.cycle_id === cycle.id);
        if (existing) {
          return prev.map((f) =>
            f.cycle_id === cycle.id
              ? { ...f, custom_overheads: [...f.custom_overheads, newItem] }
              : f
          );
        }
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
          custom_overheads: [newItem],
        };
        return [...prev, newFinancials];
      });
    },
    [cycle]
  );

  const removeCustomOverhead = useCallback(
    (itemId: string) => {
      if (!cycle) return;

      setAllFinancials((prev) =>
        prev.map((f) =>
          f.cycle_id === cycle.id
            ? { ...f, custom_overheads: f.custom_overheads.filter((c) => c.id !== itemId) }
            : f
        )
      );
    },
    [cycle]
  );

  const findRecordByPatientId = useCallback(
    (patientId: string, category?: RecordCategory) =>
      activeRecords.find(
        (r) =>
          r.patient_id === patientId.trim() &&
          (category ? r.category === category : true)
      ),
    [activeRecords]
  );

  // Toggle cycle between OPEN and LOCKED.
  const toggleLock = useCallback(() => {
    if (!cycle) return;
    setAllCycles((prev) =>
      prev.map((c) =>
        c.id === cycle.id
          ? { ...c, status: c.status === CycleStatus.OPEN ? CycleStatus.LOCKED : CycleStatus.OPEN }
          : c
      )
    );
  }, [cycle]);

  // Move unsettled cases to next month.
  const carryForward = useCallback(() => {
    if (!cycle) return { carriedCount: 0 };

    const unsettledRecords = activeRecords.filter(
      (r) => r.category === RecordCategory.CASE && (r.remaining ?? 0) > 0
    );

    if (unsettledRecords.length === 0) return { carriedCount: 0 };

    const nextMonthYear = getNextMonthLabel(cycle.month_year);
    const nextMonthLabel = getMonthLabel(nextMonthYear);

    // Check if next month's cycle exists, create if not.
    let nextCycle = allCycles.find((c) => c.month_year === nextMonthYear);
    if (!nextCycle) {
      nextCycle = {
        id: `cycle-${Date.now()}`,
        month_year: nextMonthYear,
        status: CycleStatus.OPEN,
      };
      setAllCycles((prev) => [...prev, nextCycle!]);
    }

    const unsettledIds = new Set(unsettledRecords.map((r) => r.id));
    setAllRecords((prev) =>
      prev.map((r) => {
        if (!unsettledIds.has(r.id)) return r;
        return {
          ...r,
          cycle_id: nextCycle!.id,
          month_label: nextMonthLabel,
          is_carried_forward: true,
        };
      })
    );

    return { carriedCount: unsettledRecords.length };
  }, [cycle, activeRecords, allCycles]);

  // Hard delete all records + payments for the selected month, then lock the cycle.
  const deleteMonth = useCallback(() => {
    if (!cycle) return 0;

    const monthRecords = allRecords.filter((r) => r.month_label === effectiveMonth);
    const recordIds = new Set(monthRecords.map((r) => r.id));
    const count = monthRecords.length;

    setAllRecords((prev) => prev.filter((r) => !recordIds.has(r.id)));
    setAllPayments((prev) => prev.filter((p) => !recordIds.has(p.record_id)));
    setAllCycles((prev) =>
      prev.map((c) =>
        c.id === cycle.id ? { ...c, status: CycleStatus.LOCKED } : c
      )
    );

    return count;
  }, [cycle, allRecords, effectiveMonth]);

  // ------------------------------------------
  // User Management
  // ------------------------------------------

  const addUser = useCallback(
    (userData: { username: string; password: string; role: UserRole }): boolean => {
      const duplicate = users.find(
        (u) => u.username.toLowerCase() === userData.username.toLowerCase()
      );
      if (duplicate) return false;

      const newUser: User = {
        id: `user-${Date.now()}`,
        username: userData.username,
        password_hash: userData.password,
        role: userData.role,
      };
      setUsers((prev) => [...prev, newUser]);
      return true;
    },
    [users]
  );

  const updateUser = useCallback(
    (userId: string, updates: { username?: string; password?: string }): boolean => {
      if (updates.username) {
        const duplicate = users.find(
          (u) =>
            u.id !== userId &&
            u.username.toLowerCase() === updates.username!.toLowerCase()
        );
        if (duplicate) return false;
      }

      let changed = false;
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u;
          changed = true;
          return {
            ...u,
            ...(updates.username && { username: updates.username }),
            ...(updates.password && { password_hash: updates.password }),
          };
        })
      );
      return changed;
    },
    [users]
  );

  const deleteUser = useCallback(
    (userId: string): boolean => {
      let deleted = false;
      setUsers((prev) => {
        const target = prev.find((u) => u.id === userId);
        if (!target || target.role === UserRole.ADMIN) return prev;
        deleted = true;
        return prev.filter((u) => u.id !== userId);
      });
      return deleted;
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
        labs: MOCK_LABS,
        caseTypes: MOCK_CASE_TYPES,
        users,
        cycleLocked,
        loading,
        error,
        allMonths,
        selectedMonth: effectiveMonth,
        setSelectedMonth,
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
        addCustomOverhead,
        removeCustomOverhead,
        toggleLock,
        carryForward,
        deleteMonth,
        addUser,
        updateUser,
        deleteUser,
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
