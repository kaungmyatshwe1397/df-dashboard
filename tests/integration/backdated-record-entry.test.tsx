// Record dates must move visits between month buckets without rewriting payment history.

import { afterEach, describe, expect, test, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { DataProvider, useData } from "@/context/DataContext";
import { createClient } from "@/lib/supabase/client";
import { RecordCategory } from "@/lib/global";
import { useDashboardKPIs } from "@/components/dashboard/useDashboardKPIs";

function wrapper({ children }: { children: ReactNode }) {
  return <DataProvider>{children}</DataProvider>;
}

const defaultClientFactory = vi.mocked(createClient).getMockImplementation()!;
afterEach(() => {
  vi.mocked(createClient).mockImplementation(defaultClientFactory);
  localStorage.removeItem("lastSelectedMonth");
});

async function setup() {
  localStorage.removeItem("lastSelectedMonth");
  const client = createClient();
  vi.mocked(createClient).mockReturnValue(client);
  const { result } = renderHook(() => {
    const data = useData();
    const kpis = useDashboardKPIs();
    return { ...data, kpis };
  }, { wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));
  return { result, client };
}

const gpInput = {
  patient_id: "0099/26",
  patient_name: "Test Patient",
  category: RecordCategory.GP,
  diagnosis: "Checkup",
  total_cost: 75000,
  entry_date: "2026-08-07",
};

describe("backdated record persistence", () => {
  test("retrying a committed save after a lost response creates only one receipt", async () => {
    const { result, client } = await setup();
    const input = { ...gpInput, category: RecordCategory.CASE, lab_name: "Central Lab", paid: 20000, remaining: 55000 };
    const submissionId = "c7a33985-2b3c-435c-b249-133ca7beaf62";
    const originalRpc = vi.mocked(client.rpc).getMockImplementation()!;
    vi.mocked(client.rpc).mockImplementationOnce((...args) => {
      return Promise.resolve(originalRpc(...args)).then(() => ({
        data: null, error: { message: "Connection lost after commit." },
      })) as never;
    });
    await act(async () => {
      await expect(result.current.addRecord(input, input.patient_id, 20000, submissionId)).rejects.toThrow("Connection lost");
    });
    const committedVisits = (await client.from("patient_records").select().eq("patient_id", input.patient_id)).data;
    expect(committedVisits).toHaveLength(1);
    expect((await client.from("case_payments").select().eq("record_id", committedVisits![0].id)).data).toHaveLength(1);
    await act(async () => result.current.addRecord(input, input.patient_id, 20000, submissionId));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const visits = (await client.from("patient_records").select().eq("patient_id", input.patient_id)).data;
    expect(visits).toHaveLength(1);
    const payments = (await client.from("case_payments").select().eq("record_id", visits![0].id)).data;
    expect(payments).toHaveLength(1);
    expect(result.current.getRecordTotalPaid(visits![0].id)).toBe(20000);
    expect(result.current.kpis.totalCaseRevenue).toBe(20000);
  });
  test("a failed atomic save leaves no visit or payment and allows a corrected retry", async () => {
    const { result, client } = await setup();
    const input = { ...gpInput, category: RecordCategory.CASE, lab_name: "Central Lab", paid: 20000, remaining: 55000 };
    const submissionId = crypto.randomUUID();
    vi.mocked(client.rpc).mockResolvedValueOnce({ data: null, error: { message: "Initial payment rejected." } } as never);
    await act(async () => {
      await expect(result.current.addRecord(input, input.patient_id, 20000, submissionId)).rejects.toThrow("Initial payment rejected.");
    });
    expect((await client.from("patient_records").select().eq("patient_id", input.patient_id)).data).toHaveLength(0);
    expect(result.current.selectedMonth).toBe("Sep 2026");

    await act(async () => result.current.addRecord({ ...input, entry_date: "2026-07-31", diagnosis: "Updated crown" }, input.patient_id, 20000, submissionId));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const { data: visits } = await client.from("patient_records").select().eq("patient_id", input.patient_id);
    expect(visits).toHaveLength(1);
    expect(visits?.[0]).toMatchObject({ entry_date: "2026-07-31", month_label: "Jul 2026", diagnosis: "Updated crown" });
    expect((await client.from("case_payments").select().eq("record_id", visits![0].id)).data).toEqual([
      expect.objectContaining({ payment_date: "2026-07-31", paid_amount: 20000 }),
    ]);
    expect(result.current.selectedMonth).toBe("Jul 2026");
  });
  test("a committed submission rejects changed values without changing its receipt", async () => {
    const { result, client } = await setup();
    const input = { ...gpInput, category: RecordCategory.CASE, lab_name: "Central Lab", paid: 20000, remaining: 55000 };
    const submissionId = crypto.randomUUID();
    await act(async () => result.current.addRecord(input, input.patient_id, 20000, submissionId));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await expect(result.current.addRecord({ ...input, entry_date: "2026-07-31" }, input.patient_id, 30000, submissionId)).rejects.toThrow("different values");
    const visits = (await client.from("patient_records").select().eq("patient_id", input.patient_id)).data;
    expect(visits).toHaveLength(1);
    expect(visits![0].entry_date).toBe("2026-08-07");
    expect((await client.from("case_payments").select().eq("record_id", visits![0].id)).data).toEqual([
      expect.objectContaining({ paid_amount: 20000, payment_date: "2026-08-07" }),
    ]);
  });
  test("reuses the selected date's cycle and displays the saved GP visit", async () => {
    const { result, client } = await setup();
    await act(async () => result.current.addRecord(gpInput, gpInput.patient_id));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const { data } = await client.from("patient_records").select().eq("patient_id", gpInput.patient_id).single();
    expect(data).toMatchObject({ entry_date: "2026-08-07", cycle_id: "cycle-002", month_label: "Aug 2026" });
    expect(result.current.selectedMonth).toBe("Aug 2026");
    expect(result.current.records.some((record) => record.id === data.id)).toBe(true);
    expect((await client.from("monthly_cycles").select()).data).toHaveLength(2);
  });

  test("creates a past month cycle once and reuses it for subsequent visits", async () => {
    const { result, client } = await setup();
    await act(async () => result.current.addRecord({ ...gpInput, entry_date: "2026-07-31" }, gpInput.patient_id));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => result.current.addRecord({ ...gpInput, entry_date: "2026-07-01" }, gpInput.patient_id));

    const { data: cycles } = await client.from("monthly_cycles").select().eq("month_year", "2026-07");
    expect(cycles).toHaveLength(1);
    const { data: visits } = await client.from("patient_records").select().eq("month_label", "Jul 2026");
    expect(visits).toHaveLength(2);
    expect(visits?.every((visit) => visit.cycle_id === cycles?.[0].id)).toBe(true);
    expect(result.current.selectedMonth).toBe("Jul 2026");
    expect(result.current.allMonths).toContain("Jul 2026");
  });

  test("dates a CASE initial payment with Record Date", async () => {
    const { result, client } = await setup();
    const input = { ...gpInput, category: RecordCategory.CASE, lab_name: "Central Lab", paid: 20000, remaining: 55000 };
    await act(async () => result.current.addRecord(input, input.patient_id, 20000));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const { data: visit } = await client.from("patient_records").select().eq("patient_id", input.patient_id).single();
    const { data: payment } = await client.from("case_payments").select().eq("record_id", visit.id).single();
    expect(visit).toMatchObject({ entry_date: "2026-08-07", cycle_id: "cycle-002", month_label: "Aug 2026" });
    expect(payment).toMatchObject({ payment_date: "2026-08-07", paid_amount: 20000 });
    expect(result.current.selectedMonth).toBe("Aug 2026");
  });

  test("moves a CASE and its monthly receipts while keeping installment and lab dates", async () => {
    const { result, client } = await setup();
    const { data: before } = await client.from("case_payments").select();
    await act(async () => result.current.updateRecord("rec-003", {
      lab_send_date: "2026-09-04", delivery_date: "2026-09-20",
    }));
    await act(async () => result.current.updateRecord("rec-003", { entry_date: "2026-08-05" }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const { data: visit } = await client.from("patient_records").select().eq("id", "rec-003").single();
    expect(visit).toMatchObject({ entry_date: "2026-08-05", cycle_id: "cycle-002", month_label: "Aug 2026", lab_send_date: "2026-09-04", delivery_date: "2026-09-20" });
    expect((await client.from("case_payments").select()).data).toEqual(before);
    expect(result.current.selectedMonth).toBe("Aug 2026");
    expect(result.current.getRecordTotalPaid("rec-003")).toBe(200000);
    expect(result.current.records.find((record) => record.id === "rec-003")?.cycle_id).toBe("cycle-002");
    expect(result.current.kpis.totalCaseRevenue).toBe(200000);
    act(() => result.current.setSelectedMonth("Sep 2026"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.kpis.totalCaseRevenue).toBe(250000);
    expect(result.current.records.some((record) => record.id === "rec-003")).toBe(false);
  });

  test("creates a destination cycle when editing a GP date", async () => {
    const { result, client } = await setup();
    await act(async () => result.current.updateRecord("rec-001", { entry_date: "2025-12-31" }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const { data: cycle } = await client.from("monthly_cycles").select().eq("month_year", "2025-12").single();
    const { data: visit } = await client.from("patient_records").select().eq("id", "rec-001").single();
    expect(cycle).not.toBeNull();
    expect(visit).toMatchObject({ entry_date: "2025-12-31", cycle_id: cycle.id, month_label: "Dec 2025" });
    expect(result.current.selectedMonth).toBe("Dec 2025");
  });

  test("does not move a carried-forward CASE when its record date is unchanged", async () => {
    const { result, client } = await setup();
    await act(async () => result.current.updateRecord("rec-003", { entry_date: "2026-08-05" }));
    await act(async () => result.current.updateRecord("rec-003", { cycle_id: "cycle-001", month_label: "Sep 2026", is_carried_forward: true }));
    act(() => result.current.setSelectedMonth("Sep 2026"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => result.current.updateRecord("rec-003", { entry_date: "2026-08-05", diagnosis: "Updated crown" }));
    const { data } = await client.from("patient_records").select().eq("id", "rec-003").single();
    expect(data).toMatchObject({ cycle_id: "cycle-001", month_label: "Sep 2026", is_carried_forward: true, diagnosis: "Updated crown" });
    expect(result.current.selectedMonth).toBe("Sep 2026");
  });

  test.each(["add", "edit"])("rejects future dates before %s writes", async (operation) => {
    const { result, client } = await setup();
    const save = operation === "add"
      ? result.current.addRecord({ ...gpInput, entry_date: "2026-09-16" }, gpInput.patient_id)
      : result.current.updateRecord("rec-001", { entry_date: "2026-09-16" });
    await expect(save).rejects.toThrow("Record date cannot be in the future.");
    expect(result.current.selectedMonth).toBe("Sep 2026");
    expect(client.rpc).not.toHaveBeenCalled();
  });

  test.each(["add", "edit"])("a failed cycle creation leaves %s and selected month untouched", async (operation) => {
    const { result, client } = await setup();
    if (operation === "add") vi.mocked(client.rpc).mockResolvedValueOnce({ data: null, error: { message: "Could not create month." } } as never);
    const originalFrom = vi.mocked(client.from).getMockImplementation()!;
    vi.mocked(client.from).mockImplementation((table: string) => table === "monthly_cycles"
      ? { insert: () => ({ select: () => ({ single: async () => ({ data: null, error: { message: "Could not create month." } }) }) }) } as never
      : originalFrom(table));
    const save = operation === "add"
      ? result.current.addRecord({ ...gpInput, entry_date: "2026-07-01" }, gpInput.patient_id)
      : result.current.updateRecord("rec-001", { entry_date: "2026-07-01" });
    await expect(save).rejects.toThrow("Could not create month.");
    expect(result.current.selectedMonth).toBe("Sep 2026");
    expect(result.current.records.find((record) => record.id === "rec-001")?.entry_date).toBe("2026-09-01");
  });

  test("a failed record creation does not select the destination month", async () => {
    const { result, client } = await setup();
    vi.mocked(client.rpc).mockResolvedValueOnce({ data: null, error: { message: "Could not save visit." } } as never);
    await expect(result.current.addRecord(gpInput, gpInput.patient_id)).rejects.toThrow("Could not save visit.");
    expect(result.current.selectedMonth).toBe("Sep 2026");
    expect(result.current.records).toHaveLength(3);
  });

  test("a failed record update preserves its original date and active month", async () => {
    const { result, client } = await setup();
    const originalFrom = vi.mocked(client.from).getMockImplementation()!;
    vi.mocked(client.from).mockImplementation((table: string) => table === "patient_records"
      ? { update: () => ({ eq: async () => ({ error: { message: "Could not update visit." } }) }) } as never
      : originalFrom(table));
    await expect(result.current.updateRecord("rec-001", { entry_date: "2026-08-01" })).rejects.toThrow("Could not update visit.");
    expect(result.current.selectedMonth).toBe("Sep 2026");
    expect(result.current.records.find((record) => record.id === "rec-001")?.entry_date).toBe("2026-09-01");
  });
});
