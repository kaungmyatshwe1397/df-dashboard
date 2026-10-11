// Add and edit saves must agree on the month bucket derived from the record's calendar date.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { MonthlyCycle } from "@/lib/global";
import { getRecordDateError } from "@/lib/record-date";

/** Reuses or creates the record date's cycle, including a concurrent insert by another client. */
export async function resolveRecordCycle(
  supabase: SupabaseClient,
  cycles: MonthlyCycle[],
  recordDate: string
): Promise<MonthlyCycle> {
  const dateError = getRecordDateError(recordDate);
  if (dateError) throw new Error(dateError);

  const monthYear = recordDate.slice(0, 7);
  const existingCycle = cycles.find((cycle) => cycle.month_year === monthYear);
  if (existingCycle) return existingCycle;

  const { data, error } = await supabase
    .from("monthly_cycles")
    .insert({ month_year: monthYear })
    .select()
    .single();

  if (!error && data) return { id: data.id, month_year: data.month_year };

  // Another save may have created the unique month bucket after our reference data loaded.
  if (error?.code === "23505") {
    const { data: cycle, error: lookupError } = await supabase
      .from("monthly_cycles")
      .select()
      .eq("month_year", monthYear)
      .single();
    if (!lookupError && cycle) return { id: cycle.id, month_year: cycle.month_year };
    throw new Error(lookupError?.message ?? "Failed to find the month bucket. Please try again.");
  }

  throw new Error(error?.message ?? "Failed to create the month bucket. Please try again.");
}
