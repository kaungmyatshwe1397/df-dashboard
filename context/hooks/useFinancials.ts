// ============================================
// useFinancials — Financial Management Hook
// ============================================
// Handles monthly financials CRUD and custom overhead management.
// Extracted from DataContext to follow Single Responsibility Principle.

import { useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonthlyFinancials, CustomOverhead } from "@/lib/global";

const EMPTY_FINANCIALS = {
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
  custom_overheads: [] as CustomOverhead[],
};

export function useFinancials(initialFinancials: MonthlyFinancials[] = []) {
  const [allFinancials, setAllFinancials] = useState<MonthlyFinancials[]>(initialFinancials);
  const supabaseRef = useRef(createClient());

  const getFinancialsForCycle = useCallback(
    (cycleId: string): MonthlyFinancials | null =>
      allFinancials.find((f) => f.cycle_id === cycleId) ?? null,
    [allFinancials]
  );

  const updateFinancials = useCallback(
    async (cycleId: string, updates: Partial<Omit<MonthlyFinancials, "id" | "cycle_id">>) => {
      const existing = allFinancials.find((f) => f.cycle_id === cycleId);

      if (existing) {
        const { error: updateError } = await supabaseRef.current
          .from("monthly_financials")
          .update(updates)
          .eq("cycle_id", cycleId);

        if (updateError) {
          throw new Error(updateError.message ?? "Failed to update financials.");
        }
      } else {
        const { error: insertError } = await supabaseRef.current
          .from("monthly_financials")
          .insert({ cycle_id: cycleId, ...EMPTY_FINANCIALS, ...updates });

        if (insertError) {
          throw new Error(insertError.message ?? "Failed to create financials.");
        }
      }

      setAllFinancials((prev) => {
        const fin = prev.find((f) => f.cycle_id === cycleId);
        if (fin) {
          return prev.map((f) => (f.cycle_id === cycleId ? { ...f, ...updates } : f));
        }
        return [
          ...prev,
          { id: `fin-${Date.now()}`, cycle_id: cycleId, ...EMPTY_FINANCIALS, ...updates },
        ];
      });
    },
    [allFinancials]
  );

  const addCustomOverhead = useCallback(
    async (cycleId: string, item: Omit<CustomOverhead, "id">) => {
      const existing = allFinancials.find((f) => f.cycle_id === cycleId);
      const newItem: CustomOverhead = { ...item, id: `co-${Date.now()}` };
      const updatedOverheads = [...(existing?.custom_overheads ?? []), newItem];
      const payload = JSON.stringify(updatedOverheads);

      if (existing) {
        const { error } = await supabaseRef.current
          .from("monthly_financials")
          .update({ custom_overheads: payload })
          .eq("cycle_id", cycleId);

        if (error) {
          throw new Error(error.message ?? "Failed to add custom overhead.");
        }
      } else {
        const { error } = await supabaseRef.current
          .from("monthly_financials")
          .insert({ cycle_id: cycleId, ...EMPTY_FINANCIALS, custom_overheads: payload });

        if (error) {
          throw new Error(error.message ?? "Failed to add custom overhead.");
        }
      }

      setAllFinancials((prev) => {
        const fin = prev.find((f) => f.cycle_id === cycleId);
        if (fin) {
          return prev.map((f) =>
            f.cycle_id === cycleId ? { ...f, custom_overheads: updatedOverheads } : f
          );
        }
        return [
          ...prev,
          { id: `fin-${Date.now()}`, cycle_id: cycleId, ...EMPTY_FINANCIALS, custom_overheads: updatedOverheads },
        ];
      });
    },
    [allFinancials]
  );

  const removeCustomOverhead = useCallback(
    async (cycleId: string, itemId: string) => {
      const existing = allFinancials.find((f) => f.cycle_id === cycleId);
      const updatedOverheads = (existing?.custom_overheads ?? []).filter((c) => c.id !== itemId);

      if (existing) {
        const { error } = await supabaseRef.current
          .from("monthly_financials")
          .update({ custom_overheads: JSON.stringify(updatedOverheads) })
          .eq("cycle_id", cycleId);

        if (error) {
          throw new Error(error.message ?? "Failed to remove custom overhead.");
        }
      }

      setAllFinancials((prev) =>
        prev.map((f) =>
          f.cycle_id === cycleId ? { ...f, custom_overheads: updatedOverheads } : f
        )
      );
    },
    [allFinancials]
  );

  return {
    allFinancials,
    setAllFinancials,
    getFinancialsForCycle,
    updateFinancials,
    addCustomOverhead,
    removeCustomOverhead,
  };
}
