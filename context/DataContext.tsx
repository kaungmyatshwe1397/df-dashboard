"use client";

import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateUserAction, deleteUserAction } from "@/app/admin/actions";
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
  carryForward: () => Promise<{ carriedCount: number }>;
  deleteMonth: () => Promise<number>;
  addUser: (user: { email: string; username: string; password: string; role: UserRole }) => Promise<boolean>;
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

function toPatientRecord(row: Record<string, unknown>): PatientRecord {
  if (row.category === "CASE") {
    return {
      id: row.id as string,
      cycle_id: row.cycle_id as string,
      patient_id: row.patient_id as string,
      entry_date: row.entry_date as string,
      patient_name: row.patient_name as string,
      address: row.address as string | undefined,
      category: RecordCategory.CASE,
      diagnosis: row.diagnosis as string,
      total_cost: row.total_cost as number,
      month_label: row.month_label as string,
      lab_name: row.lab_name as string,
      lab_send_date: row.lab_send_date as string | undefined,
      delivery_date: row.delivery_date as string | undefined,
      paid: row.paid as number | undefined,
      remaining: row.remaining as number | undefined,
      lab_id: row.lab_id as string | undefined,
      lab_fee: row.lab_fee as number | undefined,
      lab_payment_status: row.lab_payment_status as "PAID" | "UNPAID" | undefined,
      case_type: row.case_type as string | undefined,
      teeth: row.teeth as string | undefined,
      is_carried_forward: row.is_carried_forward as boolean,
    } as CasePatientRecordType;
  }
  return {
    id: row.id as string,
    cycle_id: row.cycle_id as string,
    patient_id: row.patient_id as string,
    entry_date: row.entry_date as string,
    patient_name: row.patient_name as string,
    address: row.address as string | undefined,
    category: RecordCategory.GP,
    diagnosis: row.diagnosis as string,
    total_cost: row.total_cost as number,
    month_label: row.month_label as string,
  };
}

function toCustomOverhead(raw: unknown): CustomOverhead[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as CustomOverhead[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allRecords, setAllRecords] = useState<PatientRecord[]>([]);
  const [allPayments, setAllPayments] = useState<CasePayment[]>([]);
  const [allFinancials, setAllFinancials] = useState<MonthlyFinancials[]>([]);
  const [allCycles, setAllCycles] = useState<MonthlyCycle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);
  const supabaseRef = useRef(createClient());

  const cycle = allCycles.find((c) => c.status === CycleStatus.OPEN) ?? null;
  const financials = cycle
    ? allFinancials.find((f) => f.cycle_id === cycle.id) ?? null
    : null;
  const cycleLocked = cycle?.status === CycleStatus.LOCKED;

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
          status: c.status as CycleStatus,
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
      if (!cycle) return;

      const monthLabel = getMonthLabel(cycle.month_year);
      const baseFields = {
        cycle_id: cycle.id,
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
        console.error("Failed to insert record:", insertError);
        return;
      }

      setAllRecords((prev) => [...prev, toPatientRecord(newRecord)]);

      if (
        recordData.category === RecordCategory.CASE &&
        initialPayment !== undefined &&
        initialPayment > 0
      ) {
        const { data: newPayment } = await supabaseRef.current
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

        if (newPayment) {
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
        console.error("Failed to update record:", updateError);
        return;
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
        console.error("Failed to insert payment:", insertError);
        return;
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
        await supabaseRef.current
          .from("patient_records")
          .update({ paid: newTotalPaid, remaining: caseRec.total_cost - newTotalPaid })
          .eq("id", record.id);

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
      await supabaseRef.current.from("case_payments").delete().eq("record_id", recordId);
      await supabaseRef.current.from("patient_records").delete().eq("id", recordId);

      setAllRecords((prev) => prev.filter((r) => r.id !== recordId));
      setAllPayments((prev) => prev.filter((p) => p.record_id !== recordId));
    },
    []
  );

  const updateFinancials = useCallback(
    async (updates: Partial<Omit<MonthlyFinancials, "id" | "cycle_id">>) => {
      if (!cycle) return;

      const existing = allFinancials.find((f) => f.cycle_id === cycle.id);

      if (existing) {
        const { error: updateError } = await supabaseRef.current
          .from("monthly_financials")
          .update(updates)
          .eq("cycle_id", cycle.id);

        if (updateError) {
          console.error("Failed to update financials:", updateError);
          return;
        }
      } else {
        const { error: insertError } = await supabaseRef.current
          .from("monthly_financials")
          .insert({
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
            custom_overheads: "[]",
            ...updates,
          });

        if (insertError) {
          console.error("Failed to insert financials:", insertError);
          return;
        }
      }

      setAllFinancials((prev) => {
        const fin = prev.find((f) => f.cycle_id === cycle.id);
        if (fin) {
          return prev.map((f) =>
            f.cycle_id === cycle.id ? { ...f, ...updates } : f
          );
        }
        return [
          ...prev,
          {
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
          },
        ];
      });
    },
    [cycle, allFinancials]
  );

  const addCustomOverhead = useCallback(
    async (item: Omit<CustomOverhead, "id">) => {
      if (!cycle) return;

      const existing = allFinancials.find((f) => f.cycle_id === cycle.id);
      const newItem: CustomOverhead = { ...item, id: `co-${Date.now()}` };
      const updatedOverheads = [...(existing?.custom_overheads ?? []), newItem];

      if (existing) {
        await supabaseRef.current
          .from("monthly_financials")
          .update({ custom_overheads: updatedOverheads })
          .eq("cycle_id", cycle.id);
      } else {
        await supabaseRef.current
          .from("monthly_financials")
          .insert({
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
            custom_overheads: updatedOverheads,
          });
      }

      setAllFinancials((prev) => {
        const fin = prev.find((f) => f.cycle_id === cycle.id);
        if (fin) {
          return prev.map((f) =>
            f.cycle_id === cycle.id
              ? { ...f, custom_overheads: updatedOverheads }
              : f
          );
        }
        return [
          ...prev,
          {
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
            custom_overheads: updatedOverheads,
          },
        ];
      });
    },
    [cycle, allFinancials]
  );

  const removeCustomOverhead = useCallback(
    async (itemId: string) => {
      if (!cycle) return;

      const existing = allFinancials.find((f) => f.cycle_id === cycle.id);
      const updatedOverheads = (existing?.custom_overheads ?? []).filter((c) => c.id !== itemId);

      if (existing) {
        await supabaseRef.current
          .from("monthly_financials")
          .update({ custom_overheads: updatedOverheads })
          .eq("cycle_id", cycle.id);
      }

      setAllFinancials((prev) =>
        prev.map((f) =>
          f.cycle_id === cycle.id
            ? { ...f, custom_overheads: updatedOverheads }
            : f
        )
      );
    },
    [cycle, allFinancials]
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

  const toggleLock = useCallback(async () => {
    if (!cycle) return;

    const newStatus = cycle.status === CycleStatus.OPEN ? CycleStatus.LOCKED : CycleStatus.OPEN;
    const { error: updateError } = await supabaseRef.current
      .from("monthly_cycles")
      .update({ status: newStatus })
      .eq("id", cycle.id);

    if (updateError) {
      console.error("Failed to toggle lock:", updateError);
      return;
    }

    setAllCycles((prev) =>
      prev.map((c) => (c.id === cycle.id ? { ...c, status: newStatus } : c))
    );
  }, [cycle]);

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
      const { data: newCycle } = await supabaseRef.current
        .from("monthly_cycles")
        .insert({ month_year: nextMonthYear, status: CycleStatus.OPEN })
        .select()
        .single();

      if (!newCycle) return { carriedCount: 0 };
      nextCycle = { id: newCycle.id, month_year: newCycle.month_year, status: newCycle.status as CycleStatus };
      setAllCycles((prev) => [...prev, nextCycle!]);
    }

    for (const record of unsettledRecords) {
      await supabaseRef.current
        .from("patient_records")
        .update({
          cycle_id: nextCycle.id,
          month_label: nextMonthLabel,
          is_carried_forward: true,
        })
        .eq("id", record.id);
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
      await supabaseRef.current.from("case_payments").delete().in("record_id", recordIds);
      await supabaseRef.current.from("patient_records").delete().in("id", recordIds);
    }

    await supabaseRef.current
      .from("monthly_cycles")
      .update({ status: CycleStatus.LOCKED })
      .eq("id", cycle.id);

    setAllRecords((prev) => prev.filter((r) => !recordIds.includes(r.id)));
    setAllPayments((prev) => prev.filter((p) => !recordIds.includes(p.record_id)));
    setAllCycles((prev) =>
      prev.map((c) => (c.id === cycle.id ? { ...c, status: CycleStatus.LOCKED } : c))
    );

    return count;
  }, [cycle, allRecords, effectiveMonth]);

  // ------------------------------------------
  // User Management (Supabase Auth + Profiles)
  // ------------------------------------------

  const addUser = useCallback(
    async (userData: { email: string; username: string; password: string; role: UserRole }): Promise<boolean> => {
      const { data: authData, error: authError } = await supabaseRef.current.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: { username: userData.username, role: userData.role },
        },
      });

      if (authError || !authData.user) {
        console.error("Failed to create user:", authError);
        return false;
      }

      // Insert profile manually (trigger on auth.users is unreliable on hosted Supabase)
      const { error: profileError } = await supabaseRef.current
        .from("profiles")
        .insert({
          id: authData.user.id,
          username: userData.username,
          email: userData.email,
          role: userData.role,
        });

      if (profileError) {
        console.error("Failed to create profile:", profileError);
        return false;
      }

      const newUser: User = {
        id: authData.user.id,
        email: userData.email,
        username: userData.username,
        password_hash: "",
        role: userData.role,
      };
      setUsers((prev) => [...prev, newUser]);
      return true;
    },
    []
  );

  const updateUser = useCallback(
    async (userId: string, updates: { username?: string; password?: string }): Promise<boolean> => {
      if (updates.username) {
        const duplicate = users.find(
          (u) => u.id !== userId && u.username.toLowerCase() === updates.username!.toLowerCase()
        );
        if (duplicate) return false;

        const { error: profileError } = await supabaseRef.current
          .from("profiles")
          .update({ username: updates.username })
          .eq("id", userId);

        if (profileError) {
          console.error("Failed to update profile:", profileError);
          return false;
        }

        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, username: updates.username! } : u))
        );
      }

      if (updates.password) {
        const success = await updateUserAction(userId, { password: updates.password });
        if (!success) return false;
      }

      return true;
    },
    [users]
  );

  const deleteUser = useCallback(
    async (userId: string): Promise<boolean> => {
      const success = await deleteUserAction(userId);
      if (!success) return false;

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      return true;
    },
    []
  );

  // ------------------------------------------
  // Lab Management
  // ------------------------------------------

  const addLab = useCallback(
    async (name: string): Promise<boolean> => {
      const trimmed = name.trim();
      if (!trimmed) return false;

      const duplicate = labs.find(
        (l) => l.lab_name.toLowerCase() === trimmed.toLowerCase()
      );
      if (duplicate) return false;

      const { data, error } = await supabaseRef.current
        .from("labs")
        .insert({ lab_name: trimmed })
        .select()
        .single();

      if (error || !data) {
        console.error("Failed to add lab:", error);
        return false;
      }

      setLabs((prev) => [...prev, { id: data.id, lab_name: data.lab_name }]);
      return true;
    },
    [labs]
  );

  const updateLab = useCallback(
    async (id: string, name: string): Promise<boolean> => {
      const trimmed = name.trim();
      if (!trimmed) return false;

      const duplicate = labs.find(
        (l) => l.id !== id && l.lab_name.toLowerCase() === trimmed.toLowerCase()
      );
      if (duplicate) return false;

      const { error } = await supabaseRef.current
        .from("labs")
        .update({ lab_name: trimmed })
        .eq("id", id);

      if (error) {
        console.error("Failed to update lab:", error);
        return false;
      }

      setLabs((prev) =>
        prev.map((l) => (l.id === id ? { ...l, lab_name: trimmed } : l))
      );
      return true;
    },
    [labs]
  );

  const deleteLab = useCallback(
    async (id: string): Promise<boolean> => {
      const { error } = await supabaseRef.current
        .from("labs")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Failed to delete lab:", error);
        return false;
      }

      setLabs((prev) => prev.filter((l) => l.id !== id));
      return true;
    },
    []
  );

  // ------------------------------------------
  // Case Type Management
  // ------------------------------------------

  const addCaseType = useCallback(
    async (name: string): Promise<boolean> => {
      const trimmed = name.trim();
      if (!trimmed) return false;

      const duplicate = caseTypes.find(
        (ct) => ct.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (duplicate) return false;

      const { data, error } = await supabaseRef.current
        .from("case_types")
        .insert({ name: trimmed })
        .select()
        .single();

      if (error || !data) {
        console.error("Failed to add case type:", error);
        return false;
      }

      setCaseTypes((prev) => [...prev, { id: data.id, name: data.name }]);
      return true;
    },
    [caseTypes]
  );

  const updateCaseType = useCallback(
    async (id: string, name: string): Promise<boolean> => {
      const trimmed = name.trim();
      if (!trimmed) return false;

      const duplicate = caseTypes.find(
        (ct) => ct.id !== id && ct.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (duplicate) return false;

      const { error } = await supabaseRef.current
        .from("case_types")
        .update({ name: trimmed })
        .eq("id", id);

      if (error) {
        console.error("Failed to update case type:", error);
        return false;
      }

      setCaseTypes((prev) =>
        prev.map((ct) => (ct.id === id ? { ...ct, name: trimmed } : ct))
      );
      return true;
    },
    [caseTypes]
  );

  const deleteCaseType = useCallback(
    async (id: string): Promise<boolean> => {
      const { error } = await supabaseRef.current
        .from("case_types")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Failed to delete case type:", error);
        return false;
      }

      setCaseTypes((prev) => prev.filter((ct) => ct.id !== id));
      return true;
    },
    []
  );

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
