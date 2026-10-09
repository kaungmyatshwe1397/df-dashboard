// DataContext month loading tests.
// Delayed Supabase responses expose month changes and superseded requests.

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataProvider, useData } from "../DataContext";

type QueryResult = { data: Record<string, unknown>[]; error: Error | null };

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function wrapper({ children }: { children: ReactNode }) {
  return <DataProvider>{children}</DataProvider>;
}

function createDelayedClient(referenceData: Promise<QueryResult>) {
  const monthQueries = new Map<string, ReturnType<typeof deferred<QueryResult>>>();
  const requestedMonths: string[] = [];
  const client = {
    from: (table: string) => {
      let month = "";
      const query = {
        select: () => query,
        order: () => query,
        eq: (_column: string, value: string) => {
          month = value;
          return query;
        },
        then: (resolve: (value: QueryResult) => void, reject: (reason: unknown) => void) => {
          if (table === "patient_records") {
            requestedMonths.push(month);
            if (!monthQueries.has(month)) monthQueries.set(month, deferred<QueryResult>());
            return monthQueries.get(month)!.promise.then(resolve, reject);
          }
          const result = table === "monthly_cycles"
            ? referenceData
            : Promise.resolve({ data: [], error: null });
          return result.then(resolve, reject);
        },
      };
      return query;
    },
  };
  vi.mocked(createClient).mockReturnValue(client as never);
  return { monthQueries, requestedMonths };
}

const defaultCreateClient = vi.mocked(createClient).getMockImplementation();

beforeEach(() => localStorage.removeItem("lastSelectedMonth"));
afterEach(() => {
  localStorage.removeItem("lastSelectedMonth");
  if (defaultCreateClient) vi.mocked(createClient).mockImplementation(defaultCreateClient);
});

describe("DataContext month requests", () => {
  test("reference refresh fetches the currently selected month", async () => {
    const reference = deferred<QueryResult>();
    const { requestedMonths, monthQueries } = createDelayedClient(reference.promise);
    const { result } = renderHook(() => useData(), { wrapper });

    act(() => result.current.setSelectedMonth("Aug 2026"));
    await act(async () => reference.resolve({ data: [], error: null }));

    await waitFor(() => expect(requestedMonths).toContain("Aug 2026"));
    expect(requestedMonths).not.toContain("Sep 2026");
    await act(async () => monthQueries.get("Aug 2026")!.resolve({ data: [], error: null }));
  });

  test("late results from an earlier month cannot replace the latest records", async () => {
    localStorage.setItem("lastSelectedMonth", "Sep 2026");
    const { requestedMonths, monthQueries } = createDelayedClient(
      Promise.resolve({ data: [], error: null })
    );
    const { result } = renderHook(() => useData(), { wrapper });
    await waitFor(() => expect(requestedMonths).toContain("Sep 2026"));

    act(() => result.current.setSelectedMonth("Aug 2026"));
    await waitFor(() => expect(requestedMonths).toContain("Aug 2026"));

    const record = (month: string) => ({
      id: month,
      patient_id: month,
      patient_name: month,
      category: "GP",
      month_label: month,
    });
    await act(async () => monthQueries.get("Aug 2026")!.resolve({ data: [record("Aug 2026")], error: null }));
    expect(result.current.records[0]?.id).toBe("Aug 2026");

    await act(async () => monthQueries.get("Sep 2026")!.resolve({ data: [record("Sep 2026")], error: null }));
    expect(result.current.records[0]?.id).toBe("Aug 2026");
  });
});
