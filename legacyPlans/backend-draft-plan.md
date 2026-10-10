# DC-FMS Backend Draft Plan

> **Status:** Draft — backend work to be done in parallel or before frontend tasks.
> **Reference:** `dc-fms-erd.mmd` · `prd.md`
> **Frontend:** See `frontend-plan.md` for the pure frontend build plan with mock state.

---

## B-1 — Supabase Project Setup

**Title:** Create Supabase project and configure environment

**Expected Outcome:** A running Supabase project with URL and anon key ready for frontend integration.

**Things To Do:**
- Create a new Supabase project via [supabase.com](https://supabase.com)
- Copy Project URL and anon (public) key
- Add to `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Enable Email/Password auth in Authentication settings

**Connection:** Must be done before frontend can connect to Supabase.

---

## B-2 — Database Schema

**Title:** Create all tables, relationships, and constraints based on ERD

**Expected Outcome:** All Supabase tables created matching `dc-fms-erd.mmd` — `users`, `monthly_cycles`, `patient_records`, `case_payments`, `labs`, `monthly_financials`.

**Things To Do:**
- Create tables via Supabase SQL Editor or migrations
- Set up foreign keys and ON DELETE behavior
- Add check constraints (e.g. `category IN ('GP','CASE')`)
- Add default values (e.g. `balance` defaults to `total_cost - amount_paid`)
- Create indexes for frequently queried columns (`cycle_id`, `category`, `lab_payment_status`)

**Connection:** Must be done before frontend can query data.

---

## B-3 — Row Level Security (RLS)

**Title:** Configure RLS policies for role-based access

**Expected Outcome:** Admin can read/write all data. Assistant can only read/write `patient_records` and `case_payments` within their scope. No access to `monthly_financials` from Assistant role.

**Things To Do:**
- Enable RLS on all tables
- Create policies for `users` table (read own profile)
- Create policies for `patient_records` and `case_payments` (Assistant: full access in active cycle; Admin: full access)
- Create policies for `monthly_financials` (Admin only)
- Create policies for `monthly_cycles` (Admin only)
- Test policies with both roles

**Connection:** Depends on B-2. Must be done before frontend uses Supabase client.

---

## B-4 — Supabase Client Setup (Frontend Integration)

**Title:** Install Supabase packages and configure client utilities

**Expected Outcome:** Browser and server Supabase clients configured and ready for use in Next.js App Router.

**Things To Do:**
- Install `@supabase/supabase-js` and `@supabase/ssr`
- Create `lib/supabase/client.ts` (browser client)
- Create `lib/supabase/server.ts` (server client for Server Actions/Route Handlers)
- Create `lib/supabase/middleware.ts` for auth session refresh in middleware

**Connection:** Depends on B-1 (project exists). Used by all frontend tasks.

---

## B-5 — Seed Data (Optional)

**Title:** Create test data for development

**Expected Outcome:** A SQL seed script that populates sample users, cycles, patient records, and financials for local development.

**Things To Do:**
- Create a test user for each role (admin, assistant)
- Create a sample open cycle with 5–10 patient records (mix of GP and Case)
- Create sample case payments and monthly financials
- Provide a `seed.sql` script that can be run in Supabase SQL Editor

**Connection:** Depends on B-2. Optional but helpful for frontend development.

---

## B-6 — Frontend ↔ Supabase Operation Map

**Title:** Document all Supabase operations that replace frontend mocks

**Expected Outcome:** A mapping of every mock operation in `frontend-plan.md` to its real Supabase equivalent.

**Frontend Task → Supabase Operations:**

| Frontend Task | Mock Operation | Supabase Replacement |
|---|---|---|
| Task 3 (Auth) | Hardcoded credential check | `supabase.auth.signInWithPassword()` |
| Task 3 (Auth) | React context for user | `@supabase/ssr` session cookies |
| Task 3 (Auth) | No route protection | `middleware.ts` with role-based redirects |
| Task 5 (Record Table) | Context reads | `supabase.from('patient_records').select('*, case_payments(*)')` |
| Task 6 (Add/Edit Modal) | Context push/patch | `supabase.from('patient_records').insert()` / `.update()` |
| Task 7 (Dashboard) | Context reads | `supabase.from('patient_records').select()` + `supabase.from('monthly_financials').select()` |
| Task 8 (Reconciliation) | Context filter + patch | `supabase.from('patient_records').select().eq('category','CASE')` + `.update({ lab_fee, lab_payment_status })` |
| Task 9 (Overhead) | Context patch | `supabase.from('monthly_financials').upsert()` |
| Task 10 (Closeout) | Context state transition | `supabase.from('patient_records').delete()` + `.update({ is_carried_forward })` + `supabase.from('monthly_cycles').insert()` + `.update({ status: 'CLOSED' })` |

**Connection:** Depends on B-1 through B-4. Reference this map when replacing mocks with real Supabase calls.

---

## Task Dependency Graph

```
B-1 (Supabase Project)
  └→ B-2 (Database Schema)
       ├→ B-3 (RLS Policies)
       └→ B-5 (Seed Data) ← optional
            └→ B-4 (Client Setup) ← depends on B-1
                 └→ B-6 (Operation Map) ← reference for mock replacement
```

---

## Summary

| # | Task | Type | Priority |
|---|------|------|----------|
| B-1 | Supabase Project Setup | Config | Required |
| B-2 | Database Schema | SQL | Required |
| B-3 | RLS Policies | SQL | Required |
| B-4 | Supabase Client Setup | JS/TS | Required |
| B-5 | Seed Data | SQL | Optional |
| B-6 | Frontend ↔ Supabase Operation Map | Reference | Required |
