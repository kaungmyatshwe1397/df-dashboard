// DataContext month loading tests.
// Delayed Supabase responses expose month changes and superseded requests.

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataProvider, useData } from "@/context/DataContext";

type QueryResult = { data: Record<string, unknown>[]; error: Error | null };

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function wrapper({ children }: { children: ReactNode }) {
  return <DataProvider>{children}</DataProvider>;
}

function createDelayedClient(
  referenceData: Promise<QueryResult>,
  options: { authenticatedRecords?: QueryResult; delayPayments?: boolean } = {}
) {
  const monthQueries = new Map<string, ReturnType<typeof deferred<QueryResult>>>();
  const paymentQueries: ReturnType<typeof deferred<QueryResult>>[] = [];
  const requestedMonths: string[] = [];
  let authStateChange: ((event: string, session: unknown) => void) | undefined;
  let authenticated = false;
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
            if (authenticated && options.authenticatedRecords) {
              return Promise.resolve(options.authenticatedRecords).then(resolve, reject);
            }
            if (!monthQueries.has(month)) monthQueries.set(month, deferred<QueryResult>());
            return monthQueries.get(month)!.promise.then(resolve, reject);
          }
          if (table === "case_payments" && options.delayPayments) {
            const paymentQuery = deferred<QueryResult>();
            paymentQueries.push(paymentQuery);
            return paymentQuery.promise.then(resolve, reject);
          }
          const result = table === "monthly_cycles"
            ? referenceData
            : Promise.resolve({ data: [], error: null });
          return result.then(resolve, reject);
        },
      };
      return query;
    },
    auth: {
      onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
        authStateChange = (event, session) => {
          if (event === "SIGNED_IN") authenticated = true;
          if (event === "SIGNED_OUT") authenticated = false;
          callback(event, session);
        };
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
    },
  };
  vi.mocked(createClient).mockReturnValue(client as never);
  return {
    monthQueries,
    paymentQueries,
    requestedMonths,
    notifySignedIn: () => authStateChange?.("SIGNED_IN", { user: { id: "user-1" } }),
    notifySignedOut: () => authStateChange?.("SIGNED_OUT", null),
  };
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

  test("keeps loading until the selected month's records finish loading", async () => {
    const { requestedMonths, monthQueries } = createDelayedClient(
      Promise.resolve({ data: [], error: null })
    );
    const { result } = renderHook(() => useData(), { wrapper });

    await waitFor(() => expect(requestedMonths).toContain("Sep 2026"));
    expect(result.current.loading).toBe(true);

    await act(async () => monthQueries.get("Sep 2026")!.resolve({ data: [], error: null }));
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  test("keeps loading until both records and payments finish loading", async () => {
    const { requestedMonths, monthQueries, paymentQueries } = createDelayedClient(
      Promise.resolve({ data: [], error: null }),
      { delayPayments: true }
    );
    const { result } = renderHook(() => useData(), { wrapper });

    await waitFor(() => expect(requestedMonths).toContain("Sep 2026"));
    await waitFor(() => expect(paymentQueries).toHaveLength(1));
    await act(async () => monthQueries.get("Sep 2026")!.resolve({ data: [], error: null }));
    expect(result.current.loading).toBe(true);

    await act(async () => paymentQueries[0].resolve({ data: [], error: null }));
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  test("reloads data after Supabase reports a successful sign-in", async () => {
    const authenticatedRecord = {
      id: "signed-in-record",
      patient_id: "patient-1",
      patient_name: "Authenticated patient",
      category: "GP",
      month_label: "Sep 2026",
    };
    const { requestedMonths, monthQueries, notifySignedIn } = createDelayedClient(
      Promise.resolve({ data: [], error: null }),
      { authenticatedRecords: { data: [authenticatedRecord], error: null } }
    );
    const { result } = renderHook(() => useData(), { wrapper });

    await waitFor(() => expect(requestedMonths).toContain("Sep 2026"));
    await act(async () => monthQueries.get("Sep 2026")!.resolve({ data: [], error: null }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const initialRequestCount = requestedMonths.length;
    act(() => notifySignedIn());

    await waitFor(() => expect(requestedMonths.length).toBeGreaterThan(initialRequestCount));
    await waitFor(() => expect(result.current.records[0]?.id).toBe("signed-in-record"));
  });

  test("does not apply reference data returned after sign-out", async () => {
    const reference = deferred<QueryResult>();
    const { requestedMonths, notifySignedOut } = createDelayedClient(reference.promise);
    const { result } = renderHook(() => useData(), { wrapper });

    act(() => notifySignedOut());
    await act(async () => reference.resolve({
      data: [{ id: "cycle-001", month_year: "2026-09" }],
      error: null,
    }));

    expect(result.current.allMonths).toEqual([]);
    expect(requestedMonths).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  test("keeps loading while a newer month request is pending", async () => {
    const reference = deferred<QueryResult>();
    const { monthQueries, requestedMonths } = createDelayedClient(reference.promise);
    const { result } = renderHook(() => useData(), { wrapper });

    await act(async () => reference.resolve({ data: [], error: null }));
    await waitFor(() => expect(requestedMonths).toContain("Sep 2026"));

    act(() => result.current.setSelectedMonth("Aug 2026"));
    await waitFor(() => expect(requestedMonths).toContain("Aug 2026"));

    await act(async () => monthQueries.get("Sep 2026")!.resolve({ data: [], error: null }));
    expect(result.current.loading).toBe(true);

    await act(async () => monthQueries.get("Aug 2026")!.resolve({ data: [], error: null }));
    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});
