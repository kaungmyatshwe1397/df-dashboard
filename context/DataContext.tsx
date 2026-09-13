"use client";

import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
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
  RecordCategory,
  PaymentStatus,
  CasePatientRecordType,
} from "@/lib/global";
import { getMonthLabel, getNextMonthLabel, toPatientRecord, toCustomOverhead } from "@/lib/data-helpers";
import { useUser } from "./hooks/useUser";
import { useLab } from "./hooks/useLab";
import { useCaseType } from "./hooks/useCaseType";
import { useFinancials } from "./hooks/useFinancials";

interface DataContextType {
  cycle: MonthlyCycle | null;
  records: PatientRecord[];
  payments: CasePayment[];
  financials: MonthlyFinancials | null;
  labs: Lab[];
  caseTypes: CaseType[];
  users: User[];
  loading: boolean;
  error: string | null;
  allMonths: string[];
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  getPaymentsForRecord: (recordId: string) => CasePayment[];
  getRecordBalance: (record: PatientRecord) => number;
  getRecordTotalPaid: (recordId: string) => number;
  refreshData: () => void;
  addRecord: (record: Omit<PatientRecord, "id" | "cycle_id" | "entry_date" | "is_carried_forward" | "month_label">, initialPayment?: number) => Promise<void>;
  updateRecord: (recordId: string, updates: Partial<PatientRecord>) => Promise<void>;
  deleteRecord: (recordId: string) => Promise<void>;
  addPayment: (payment: Omit<CasePayment, "id" | "payment_date">) => Promise<void>;
  findRecordByPatientId: (patientId: string, category?: RecordCategory) => PatientRecord | undefined;
  updateFinancials: (updates: Partial<Omit<MonthlyFinancials, "id" | "cycle_id">>) => Promise<void>;
  addCustomOverhead: (item: Omit<CustomOverhead, "id">) => Promise<void>;
  removeCustomOverhead: (itemId: string) => Promise<void>;
  carryForward: () => Promise<{ carriedCount: number }>;
  deleteMonth: () => Promise<number>;
  addUser: (user: { email: string; username: string; password: string; role: UserRole }) => Promise<string | null>;
  updateUser: (userId: string, updates: { username?: string; password?: string }) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  addLab: (name: string) => Promise<boolean>;
  updateLab: (id: string, name: string) => Promise<boolean>;
  deleteLab: (id: string) => Promise<boolean>;
  addCaseType: (name: string) => Promise<boolean>;
  updateCaseType: (id: string, name: string) => Promise<boolean>;
  deleteCaseType: (id: string) => Promise<boolean>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);



export function DataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allRecords, setAllRecords] = useState<PatientRecord[]>([]);
  const [allPayments, setAllPayments] = useState<CasePayment[]>([]);
  const [allCycles, setAllCycles] = useState<MonthlyCycle[]>([]);
  const { users, setUsers, addUser, updateUser, deleteUser } = useUser();
  const { labs, setLabs, addLab, updateLab, deleteLab } = useLab();
  const { caseTypes, setCaseTypes, addCaseType, updateCaseType, deleteCaseType } = useCaseType();
  const { allFinancials, setAllFinancials, getFinancialsForCycle, updateFinancials, addCustomOverhead, removeCustomOverhead } = useFinancials();
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);
  const supabaseRef = useRef(createClient());

  const cycle = allCycles.find((c) => c.status === "OPEN") ?? null;
  const financials = cycle ? getFinancialsForCycle(cycle.id) : null;

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

  const effectiveMonth = selectedMonth || (cycle ? getMonthLabel(cycle.month_year) : allMonths[0] ?? "");

  const activeRecords = useMemo(
    () => allRecords.filter((r) => r.month_label === effectiveMonth),
    [allRecords, effectiveMonth]
  );

  // ------------------------------------------
  // Fetch all data from Supabase
  // ------------------------------------------

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cyclesRes, recordsRes, paymentsRes, financialsRes, labsRes, caseTypesRes, usersRes] = await Promise.all([
        supabaseRef.current.from("monthly_cycles").select("*").order("month_year", { ascending: false }),
        supabaseRef.current.from("patient_records").select("*").order("entry_date", { ascending: true }),
        supabaseRef.current.from("case_payments").select("*").order("payment_date", { ascending: true }),
        supabaseRef.current.from("monthly_financials").select("*"),
        supabaseRef.current.from("labs").select("*").order("lab_name"),
        supabaseRef.current.from("case_types").select("*").order("name"),
        supabaseRef.current.from("profiles").select("id, username, email, role"),
      ]);

      if (cyclesRes.error) throw cyclesRes.error;
      if (recordsRes.error) throw recordsRes.error;
      if (paymentsRes.error) throw paymentsRes.error;
      if (financialsRes.error) throw financialsRes.error;
      if (labsRes.error) throw labsRes.error;
      if (caseTypesRes.error) throw caseTypesRes.error;
      if (usersRes.error) throw usersRes.error;

      setAllCycles(
        (cyclesRes.data ?? []).map((c: Record<string, unknown>) => ({
          id: c.id as string,
          month_year: c.month_year as string,
          status: c.status as "OPEN" | "LOCKED",
        }))
      );
      setAllRecords((recordsRes.data ?? []).map(toPatientRecord));
      setAllPayments(
        (paymentsRes.data ?? []).map((p: Record<string, unknown>) => ({
          id: p.id as string,
          record_id: p.record_id as string,
          payment_date: p.payment_date as string,
          paid_amount: p.paid_amount as number,
          payment_note: p.payment_note as string | undefined,
          payment_status: p.payment_status as PaymentStatus,
        }))
      );
      setAllFinancials(
        (financialsRes.data ?? []).map((f: Record<string, unknown>) => ({
          id: f.id as string,
          cycle_id: f.cycle_id as string,
          total_gp: f.total_gp as number,
          total_case: f.total_case as number,
          gross_income: f.gross_income as number,
          lab_fee: f.lab_fee as number,
          relieving_fee: f.relieving_fee as number,
          general_expenses: f.general_expenses as number,
          assistant_fee: f.assistant_fee as number,
          bonus: f.bonus as number,
          utility_costs: f.utility_costs as number,
          building_rent: f.building_rent as number,
          net_profit: f.net_profit as number,
          custom_overheads: toCustomOverhead(f.custom_overheads),
        }))
      );
      setLabs((labsRes.data ?? []).map((l: Record<string, unknown>) => ({ id: l.id as string, lab_name: l.lab_name as string })));
      setCaseTypes((caseTypesRes.data ?? []).map((ct: Record<string, unknown>) => ({ id: ct.id as string, name: ct.name as string })));
      setUsers(
        (usersRes.data ?? []).map((u: Record<string, unknown>) => ({
          id: u.id as string,
          email: u.email as string,
          username: u.username as string,
          password_hash: "",
          role: u.role as UserRole,
        }))
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData, refreshKey]);

  const refreshData = useCallback(() => setRefreshKey((k) => k + 1), []);

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
    async (
      recordData: Omit<PatientRecord, "id" | "cycle_id" | "entry_date" | "is_carried_forward" | "month_label">,
      initialPayment?: number
    ) => {
      let activeCycle = cycle;

      if (!activeCycle) {
        // No OPEN cycle exists — auto-create one for the current month
        const now = new Date();
        const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const { data: newCycle, error: cycleError } = await supabaseRef.current
          .from("monthly_cycles")
          .insert({ month_year: monthYear, status: "OPEN" })
          .select()
          .single();

        if (cycleError || !newCycle) {
          throw new Error(cycleError?.message ?? "Failed to create a new cycle. Please contact an admin.");
        }

        activeCycle = { id: newCycle.id, month_year: newCycle.month_year, status: newCycle.status as "OPEN" | "LOCKED" };
        setAllCycles((prev) => [...prev, activeCycle!]);
      }

      const monthLabel = getMonthLabel(activeCycle.month_year);
      const baseFields = {
        cycle_id: activeCycle.id,
        entry_date: new Date().toISOString().split("T")[0],
        month_label: monthLabel,
      };

      const insertData = recordData.category === RecordCategory.CASE
        ? { ...recordData, ...baseFields, is_carried_forward: false }
        : { ...recordData, ...baseFields };

      const { data: newRecord, error: insertError } = await supabaseRef.current
        .from("patient_records")
        .insert(insertData)
        .select()
        .single();

      if (insertError || !newRecord) {
        throw new Error(insertError?.message ?? "Failed to create record.");
      }

      setAllRecords((prev) => [...prev, toPatientRecord(newRecord)]);
      setSelectedMonth(monthLabel);

      if (
        recordData.category === RecordCategory.CASE &&
        initialPayment !== undefined &&
        initialPayment > 0
      ) {
        const { data: newPayment, error: paymentError } = await supabaseRef.current
          .from("case_payments")
          .insert({
            record_id: newRecord.id,
            payment_date: new Date().toISOString().split("T")[0],
            paid_amount: initialPayment,
            payment_note: "Initial payment",
            payment_status: PaymentStatus.PAID,
          })
          .select()
          .single();

        if (paymentError || !newPayment) {
          throw new Error(paymentError?.message ?? "Record created but initial payment failed.");
        }

        setAllPayments((prev) => [
          ...prev,
          {
            id: newPayment.id,
            record_id: newPayment.record_id,
            payment_date: newPayment.payment_date,
            paid_amount: newPayment.paid_amount,
            payment_note: newPayment.payment_note,
            payment_status: newPayment.payment_status,
          },
        ]);
      }
    },
    [cycle]
  );

  const updateRecord = useCallback(
    async (recordId: string, updates: Partial<PatientRecord>) => {
      const { error: updateError } = await supabaseRef.current
        .from("patient_records")
        .update(updates)
        .eq("id", recordId);

      if (updateError) {
        throw new Error(updateError.message ?? "Failed to update record.");
      }

      setAllRecords((prev) =>
        prev.map((r) => (r.id === recordId ? { ...r, ...updates } as PatientRecord : r))
      );
    },
    []
  );

  const addPayment = useCallback(
    async (paymentData: Omit<CasePayment, "id" | "payment_date">) => {
      const { data: newPayment, error: insertError } = await supabaseRef.current
        .from("case_payments")
        .insert({
          ...paymentData,
          payment_date: new Date().toISOString().split("T")[0],
        })
        .select()
        .single();

      if (insertError || !newPayment) {
        throw new Error(insertError?.message ?? "Failed to record payment.");
      }

      setAllPayments((prev) => [
        ...prev,
        {
          id: newPayment.id,
          record_id: newPayment.record_id,
          payment_date: newPayment.payment_date,
          paid_amount: newPayment.paid_amount,
          payment_note: newPayment.payment_note,
          payment_status: newPayment.payment_status,
        },
      ]);

      const record = allRecords.find((r) => r.id === paymentData.record_id);
      if (record?.category === RecordCategory.CASE) {
        const caseRec = record as CasePatientRecordType;
        const newTotalPaid = (caseRec.paid ?? 0) + paymentData.paid_amount;
        const { error: updateError } = await supabaseRef.current
          .from("patient_records")
          .update({ paid: newTotalPaid, remaining: caseRec.total_cost - newTotalPaid })
          .eq("id", record.id);

        if (updateError) {
          throw new Error(updateError.message ?? "Payment recorded but failed to update record balance.");
        }

        setAllRecords((prev) =>
          prev.map((r) =>
            r.id === record.id
              ? { ...r, paid: newTotalPaid, remaining: caseRec.total_cost - newTotalPaid } as CasePatientRecordType
              : r
          )
        );
      }
    },
    [allRecords]
  );

  const deleteRecord = useCallback(
    async (recordId: string) => {
      const { error: paymentsError } = await supabaseRef.current
        .from("case_payments")
        .delete()
        .eq("record_id", recordId);

      if (paymentsError) {
        throw new Error(paymentsError.message ?? "Failed to delete payments.");
      }

      const { error: recordError } = await supabaseRef.current
        .from("patient_records")
        .delete()
        .eq("id", recordId);

      if (recordError) {
        throw new Error(recordError.message ?? "Failed to delete record.");
      }

      setAllRecords((prev) => prev.filter((r) => r.id !== recordId));
      setAllPayments((prev) => prev.filter((p) => p.record_id !== recordId));
    },
    []
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

  const carryForward = useCallback(async () => {
    if (!cycle) return { carriedCount: 0 };

    const unsettledRecords = activeRecords.filter(
      (r) => r.category === RecordCategory.CASE && (r.remaining ?? 0) > 0
    );

    if (unsettledRecords.length === 0) return { carriedCount: 0 };

    const nextMonthYear = getNextMonthLabel(cycle.month_year);
    const nextMonthLabel = getMonthLabel(nextMonthYear);

    let nextCycle = allCycles.find((c) => c.month_year === nextMonthYear);
    if (!nextCycle) {
      const { data: newCycle, error: cycleError } = await supabaseRef.current
        .from("monthly_cycles")
        .insert({ month_year: nextMonthYear, status: "OPEN" })
        .select()
        .single();

      if (cycleError || !newCycle) {
        throw new Error(cycleError?.message ?? "Failed to create next cycle.");
      }
      nextCycle = { id: newCycle.id, month_year: newCycle.month_year, status: newCycle.status as "OPEN" | "LOCKED" };
      setAllCycles((prev) => [...prev, nextCycle!]);
    }

    for (const record of unsettledRecords) {
      const { error } = await supabaseRef.current
        .from("patient_records")
        .update({
          cycle_id: nextCycle.id,
          month_label: nextMonthLabel,
          is_carried_forward: true,
        })
        .eq("id", record.id);

      if (error) {
        throw new Error(error.message ?? "Failed to carry forward record.");
      }
    }

    setAllRecords((prev) =>
      prev.map((r) => {
        const unsettled = unsettledRecords.find((u) => u.id === r.id);
        if (!unsettled) return r;
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

  const deleteMonth = useCallback(async () => {
    if (!cycle) return 0;

    const monthRecords = allRecords.filter((r) => r.month_label === effectiveMonth);
    const recordIds = monthRecords.map((r) => r.id);
    const count = monthRecords.length;

    if (recordIds.length > 0) {
      const { error: paymentsError } = await supabaseRef.current
        .from("case_payments")
        .delete()
        .in("record_id", recordIds);

      if (paymentsError) {
        throw new Error(paymentsError.message ?? "Failed to delete payments.");
      }

      const { error: recordsError } = await supabaseRef.current
        .from("patient_records")
        .delete()
        .in("id", recordIds);

      if (recordsError) {
        throw new Error(recordsError.message ?? "Failed to delete records.");
      }
    }

    setAllRecords((prev) => prev.filter((r) => !recordIds.includes(r.id)));
    setAllPayments((prev) => prev.filter((p) => !recordIds.includes(p.record_id)));

    return count;
  }, [cycle, allRecords, effectiveMonth]);

  return (
    <DataContext.Provider
      value={{
        cycle,
        records: activeRecords,
        payments: allPayments,
        financials,
        labs,
        caseTypes,
        users,
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
        updateFinancials: cycle
          ? (updates) => updateFinancials(cycle.id, updates)
          : async () => { throw new Error("No open cycle found. Cannot update financials."); },
        addCustomOverhead: cycle
          ? (item) => addCustomOverhead(cycle.id, item)
          : async () => { throw new Error("No open cycle found. Cannot add custom overhead."); },
        removeCustomOverhead: cycle
          ? (itemId) => removeCustomOverhead(cycle.id, itemId)
          : async () => { throw new Error("No open cycle found. Cannot remove custom overhead."); },
        carryForward,
        deleteMonth,
        addUser,
        updateUser,
        deleteUser,
        addLab,
        updateLab,
        deleteLab,
        addCaseType,
        updateCaseType,
        deleteCaseType,
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
