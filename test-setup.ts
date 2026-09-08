import "@testing-library/jest-dom/vitest";
import { vi, beforeEach } from "vitest";

// ──────────────────────────────────────────────
// Mock data
// ──────────────────────────────────────────────

const SEED_CYCLES = [
  { id: "cycle-001", month_year: "2026-09", status: "OPEN" },
  { id: "cycle-002", month_year: "2026-08", status: "LOCKED" },
];

const SEED_RECORDS = [
  {
    id: "rec-001", cycle_id: "cycle-001", patient_id: "0001/26",
    entry_date: "2026-09-01", patient_name: "John Doe", address: "123 Main St",
    category: "GP", diagnosis: "Common cold treatment", total_cost: 50000,
    month_label: "Sep 2026",
  },
  {
    id: "rec-002", cycle_id: "cycle-001", patient_id: "0003/26",
    entry_date: "2026-09-02", patient_name: "Jane Smith",
    category: "CASE", diagnosis: "RPD at 41,42,43,44", total_cost: 250000,
    month_label: "Sep 2026", lab_name: "Central Lab", paid: 250000,
    remaining: 0, is_carried_forward: false, case_type: "RPD", teeth: "41,42,43,44",
  },
  {
    id: "rec-003", cycle_id: "cycle-001", patient_id: "0004/26",
    entry_date: "2026-09-04", patient_name: "Robert Johnson",
    category: "CASE", diagnosis: "Crown at 16", total_cost: 500000,
    month_label: "Sep 2026", lab_name: "City Diagnostics", paid: 200000,
    remaining: 300000, is_carried_forward: false, case_type: "Crown", teeth: "16",
  },
];

const SEED_PAYMENTS = [
  { id: "pay-001", record_id: "rec-002", payment_date: "2026-09-02", paid_amount: 150000, payment_note: "Initial deposit", payment_status: "COMPLETED" },
  { id: "pay-002", record_id: "rec-002", payment_date: "2026-09-03", paid_amount: 100000, payment_note: "Second payment", payment_status: "COMPLETED" },
  { id: "pay-003", record_id: "rec-003", payment_date: "2026-09-04", paid_amount: 200000, payment_note: "First installment", payment_status: "COMPLETED" },
];

const SEED_FINANCIALS = [
  {
    id: "fin-001", cycle_id: "cycle-001", total_gp: 50000, total_case: 450000,
    gross_income: 500000, lab_fee: 100000, relieving_fee: 0, general_expenses: 50000,
    assistant_fee: 40000, bonus: 10000, utility_costs: 20000, building_rent: 80000,
    net_profit: 200000, custom_overheads: [],
  },
];

const SEED_LABS = [
  { id: "lab-001", lab_name: "Central Lab" },
  { id: "lab-002", lab_name: "City Diagnostics" },
];

const SEED_CASE_TYPES = [
  { id: "ct-001", name: "RPD" },
  { id: "ct-002", name: "Crown" },
];

const SEED_PROFILES = [
  { id: "user-001", username: "admin", email: "admin@test.com", role: "ADMIN" },
  { id: "user-002", username: "assistant", email: "assistant@test.com", role: "ASSISTANT" },
];

// ──────────────────────────────────────────────
// Table data store (deep-copied per test)
// ──────────────────────────────────────────────

function freshData(): Record<string, unknown[]> {
  return {
    monthly_cycles: SEED_CYCLES.map((c) => ({ ...c })),
    patient_records: SEED_RECORDS.map((r) => ({ ...r })),
    case_payments: SEED_PAYMENTS.map((p) => ({ ...p })),
    monthly_financials: SEED_FINANCIALS.map((f) => ({ ...f, custom_overheads: [...f.custom_overheads] })),
    labs: SEED_LABS.map((l) => ({ ...l })),
    case_types: SEED_CASE_TYPES.map((ct) => ({ ...ct })),
    profiles: SEED_PROFILES.map((u) => ({ ...u })),
  };
}

let db = freshData();

beforeEach(() => {
  db = freshData();
});

// ──────────────────────────────────────────────
// Mock Supabase client
// ──────────────────────────────────────────────
//
// The real Supabase PostgrestFilterBuilder extends Promise and resolves
// with { data, error }. We mimic this by returning an object that:
//   1. Has chainable .select(), .order(), .eq(), .in() methods
//   2. Is thenable — has .then(onFulfilled, onRejected) which resolves
//      with { data, error } when Promise.all calls it
//   3. Has .single() for single-row queries
//   4. Has .insert(), .update(), .delete() for mutations

function mockQuery(table: string, rows: unknown[]) {
  let data = [...rows];

  const q: Record<string, unknown> = {};

  q.select = vi.fn().mockReturnValue(q);
  q.order = vi.fn().mockReturnValue(q);
  q.eq = vi.fn().mockImplementation((col: string, val: unknown) => {
    data = data.filter((r) => (r as Record<string, unknown>)[col] === val);
    return q;
  });
  q.in = vi.fn().mockImplementation((col: string, vals: unknown[]) => {
    data = data.filter((r) => vals.includes((r as Record<string, unknown>)[col]));
    return q;
  });

  q.single = vi.fn().mockImplementation(() =>
    Promise.resolve({ data: data[0] ?? null, error: null })
  );

  q.insert = vi.fn().mockImplementation((rowData: Record<string, unknown>) => {
    const row = { id: `mock-${Date.now()}-${Math.random()}`, ...rowData };
    if (!db[table]) db[table] = [];
    db[table].push(row);
    data = [row];
    // Return a nested chainable for .insert().select().single()
    return {
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: row, error: null }),
        eq: q.eq,
        update: q.update,
        delete: q.delete,
        then: makeThenable(() => ({ data: row, error: null })),
      }),
      eq: q.eq,
      update: q.update,
      delete: q.delete,
    };
  });

  q.update = vi.fn().mockReturnValue(q);
  q.delete = vi.fn().mockReturnValue(q);
  q.upsert = vi.fn().mockReturnValue(q);

  // ── Thenable ──
  // Promise.all calls .then(resolve, reject) on each element.
  // We must call resolve({ data, error }) so Promise.all resolves.
  const thenFn = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) => {
    Promise.resolve({ data, error: null }).then(
      (v) => resolve(v),
      (e) => (reject ? reject(e) : undefined),
    );
  };

  q.then = thenFn;
  q.catch = (reject?: (e: unknown) => void) =>
    Promise.resolve({ data, error: null }).catch(reject);
  q.finally = (cb?: () => void) =>
    Promise.resolve({ data, error: null }).finally(cb);

  return q;
}

function makeThenable(resolver: () => { data: unknown; error: null }) {
  return (resolve: (v: unknown) => void, reject?: (e: unknown) => void) => {
    Promise.resolve(resolver()).then(
      (v) => resolve(v),
      (e) => (reject ? reject(e) : undefined),
    );
  };
}

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => mockQuery(table, db[table] || [])),
    auth: {
      signUp: vi.fn().mockResolvedValue({ data: { user: { id: "new-user" } }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      updateUser: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      admin: {
        updateUserById: vi.fn().mockResolvedValue({ error: null }),
        deleteUser: vi.fn().mockResolvedValue({ error: null }),
      },
    },
  })),
}));
