import "@testing-library/jest-dom/vitest";
import { vi, beforeEach } from "vitest";

// ──────────────────────────────────────────────
// Mock data
// ──────────────────────────────────────────────

const SEED_CYCLES = [
  { id: "cycle-001", month_year: "2026-09" },
  { id: "cycle-002", month_year: "2026-08" },
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

const SEED_PATIENTS = [
  {
    id: "pat-001", patient_id: "0001/26", patient_name: "John Doe", age: 34,
    gender: "MALE", address: "123 Main St", drug_allergy: null,
    past_dental_history: null, current_medications: [], past_medical_history: [],
    created_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "pat-002", patient_id: "0003/26", patient_name: "Jane Smith", age: 45,
    gender: "FEMALE", address: null, drug_allergy: "Penicillin",
    past_dental_history: null, current_medications: ["Metformin"],
    past_medical_history: ["Diabetes"], created_at: "2026-09-02T00:00:00Z",
  },
  {
    id: "pat-003", patient_id: "0004/26", patient_name: "Robert Johnson", age: 52,
    gender: "MALE", address: null, drug_allergy: null,
    past_dental_history: null, current_medications: [],
    past_medical_history: ["Hypertension"], created_at: "2026-09-04T00:00:00Z",
  },
];

const SEED_MEDICAL_HISTORY_OPTIONS = [
  { id: "mh-001", name: "Heart Disease" },
  { id: "mh-002", name: "Hypertension" },
  { id: "mh-003", name: "Diabetes" },
];

const SEED_PROFILES = [
  { id: "user-001", username: "admin", email: "admin@test.com", role: "ADMIN" },
  { id: "user-002", username: "assistant", email: "assistant@test.com", role: "ASSISTANT" },
];

// ──────────────────────────────────────────────
// Auth user store (tracked separately from DB tables)
// ──────────────────────────────────────────────

interface AuthUser {
  id: string;
  email: string;
  password: string;
}

let authUsers: AuthUser[] = [];
let authIdCounter = 1;

function generateAuthId(): string {
  return `auth-${String(authIdCounter++).padStart(3, "0")}`;
}

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
    patients: SEED_PATIENTS.map((p) => ({
      ...p,
      current_medications: [...p.current_medications],
      past_medical_history: [...p.past_medical_history],
    })),
    medical_history_options: SEED_MEDICAL_HISTORY_OPTIONS.map((o) => ({ ...o })),
    profiles: SEED_PROFILES.map((u) => ({ ...u })),
  };
}

let db = freshData();

beforeEach(() => {
  db = freshData();
  authUsers = [];
  authIdCounter = 1;
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
  q.maybeSingle = vi.fn().mockImplementation(() =>
    Promise.resolve({ data: data[0] ?? null, error: null })
  );
  q.limit = vi.fn().mockReturnValue(q);

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

  q.update = vi.fn().mockImplementation((values: Record<string, unknown>) => {
    // Persist on await: mutate the matching db rows in place so subsequent
    // reads in the same test observe the update (mirrors PostgREST PATCH).
    const apply = () => {
      const matchedIds = new Set(
        data.map((r) => (r as Record<string, unknown>).id)
      );
      const rows = (db[table] ?? []) as Record<string, unknown>[];
      for (const row of rows) {
        if (matchedIds.has(row.id)) Object.assign(row, values);
      }
      data = data.map((r) => ({ ...(r as Record<string, unknown>) }));
    };
    q.then = (
      resolve: (v: unknown) => void,
      reject?: (e: unknown) => void
    ) => {
      apply();
      Promise.resolve({ data, error: null }).then(
        (v) => resolve(v),
        (e) => (reject ? reject(e) : undefined)
      );
    };
    return q;
  });
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
    // Mirrors the atomic register_patient_with_record RPC: validates the
    // new/returning flag, inserts the patient when new, then the visit
    // record (registry name/address), in one result.
    rpc: vi.fn((fn: string, args: Record<string, unknown>) => {
      if (fn !== "register_patient_with_record") {
        return Promise.resolve({ data: null, error: { message: `Unknown function ${fn}` } });
      }
      const patient = args.p_patient as Record<string, unknown>;
      const record = args.p_record as Record<string, unknown>;
      const isNewPatient = args.p_is_new_patient === true;
      if (!patient || !patient.patient_id) {
        return Promise.resolve({ data: null, error: { code: "23502", message: "Patient ID is required." } });
      }
      const pid = patient.patient_id as string;
      const existing = (db.patients as Record<string, unknown>[]).find(
        (p) => p.patient_id === pid
      );
      if (isNewPatient && existing) {
        return Promise.resolve({
          data: null,
          error: {
            code: "23505",
            message:
              "The patient ID is already registered for another person. Check your patient ID again.",
          },
        });
      }
      if (!isNewPatient && !existing) {
        return Promise.resolve({
          data: null,
          error: { code: "23503", message: "Patient ID is not registered." },
        });
      }
      let patientUuid: string;
      let registryName: unknown;
      let registryAddress: unknown;
      if (existing) {
        patientUuid = existing.id as string;
        registryName = existing.patient_name;
        registryAddress = existing.address;
      } else {
        patientUuid = `mock-pat-${Date.now()}-${Math.random()}`;
        (db.patients as Record<string, unknown>[]).push({
          id: patientUuid,
          created_at: new Date().toISOString(),
          ...patient,
        });
        registryName = patient.patient_name;
        registryAddress = patient.address;
      }
      const row: Record<string, unknown> = {
        id: `mock-rec-${Date.now()}-${Math.random()}`,
        is_carried_forward: false,
        ...record,
        patient_name: registryName,
        address: registryAddress ?? null,
      };
      (db.patient_records as Record<string, unknown>[]).push(row);
      return Promise.resolve({
        data: { patient_id: patientUuid, record: row },
        error: null,
      });
    }),
    auth: {
      signUp: vi.fn().mockImplementation(
        ({ email, password }: { email: string; password: string }) => {
          const existing = authUsers.find((u) => u.email === email);
          if (existing) {
            return Promise.resolve({ data: { user: null }, error: { message: "User already registered" } });
          }
          const user = { id: generateAuthId(), email, password };
          authUsers.push(user);
          return Promise.resolve({ data: { user: { id: user.id, email } }, error: null });
        }
      ),
      signInWithPassword: vi.fn().mockImplementation(
        ({ email, password }: { email: string; password: string }) => {
          const user = authUsers.find((u) => u.email === email && u.password === password);
          if (!user) {
            return Promise.resolve({ data: { user: null, session: null }, error: { message: "Invalid login credentials" } });
          }
          return Promise.resolve({ data: { user: { id: user.id, email: user.email }, session: { access_token: "mock-token" } }, error: null });
        }
      ),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      updateUser: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      admin: {
        createUser: vi.fn().mockImplementation(
          ({ email, password }: { email: string; password: string }) => {
            const existing = authUsers.find((u) => u.email === email);
            if (existing) {
              return Promise.resolve({ data: { user: null }, error: { message: "User already registered" } });
            }
            const user = { id: generateAuthId(), email, password };
            authUsers.push(user);
            return Promise.resolve({ data: { user: { id: user.id, email } }, error: null });
          }
        ),
        listUsers: vi.fn().mockImplementation(() => {
          return Promise.resolve({
            data: { users: authUsers.map((u) => ({ id: u.id, email: u.email })) },
            error: null,
          });
        }),
        updateUserById: vi.fn().mockImplementation(
          (userId: string, { password }: { password: string }) => {
            const user = authUsers.find((u) => u.id === userId);
            if (!user) {
              return Promise.resolve({ data: null, error: { message: "User not found" } });
            }
            user.password = password;
            return Promise.resolve({ data: { user: { id: user.id } }, error: null });
          }
        ),
        deleteUser: vi.fn().mockImplementation((userId: string) => {
          const index = authUsers.findIndex((u) => u.id === userId);
          if (index === -1) {
            return Promise.resolve({ data: null, error: { message: "User not found" } });
          }
          authUsers.splice(index, 1);
          return Promise.resolve({ data: null, error: null });
        }),
      },
    },
  })),
}));
