// A competing save can create a month bucket after the caller's cycle cache was loaded.

import { describe, expect, test, vi } from "vitest";
import { createClient } from "@/lib/supabase/client";
import { resolveRecordCycle } from "@/lib/services/recordCycleService";

describe("record cycle resolution", () => {
  test("reuses the winning cycle after another client creates the same month", async () => {
    const client = createClient();
    vi.mocked(client.from).mockReturnValueOnce({
      insert: () => ({ select: () => ({ single: async () => ({
        data: null, error: { code: "23505", message: "Month already exists." },
      }) }) }),
    } as never);

    const cycle = await resolveRecordCycle(client, [], "2026-08-31");
    expect(cycle).toEqual({ id: "cycle-002", month_year: "2026-08" });
  });

  test("reports a failed lookup after a competing cycle insert", async () => {
    const client = createClient();
    vi.mocked(client.from).mockReturnValueOnce({
      insert: () => ({ select: () => ({ single: async () => ({
        data: null, error: { code: "23505", message: "Month already exists." },
      }) }) }),
    } as never).mockReturnValueOnce({
      select: () => ({ eq: () => ({ single: async () => ({
        data: null, error: { message: "Failed to load the month. Please try again." },
      }) }) }),
    } as never);

    await expect(resolveRecordCycle(client, [], "2026-08-31"))
      .rejects.toThrow("Failed to load the month. Please try again.");
  });
});
