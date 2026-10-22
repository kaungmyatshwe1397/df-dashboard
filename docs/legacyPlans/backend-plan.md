# DC-FMS Backend Integration Plan

> **Status:** Ready to execute - replaces all mock data with real Supabase calls.
> **Stack:** Supabase (PostgreSQL + Auth + RLS) | Supabase CLI Migrations | @supabase/ssr | Next.js App Router
> **Reference:** dc-fms-erd.mmd | prd.md | frontend-plan.md
> **Frontend:** All 10 tasks complete with mock state. This plan replaces every mock operation.

---

## B-1 - Supabase Project Setup

**Title:** Create Supabase project and configure environment

**Expected Outcome:** A running Supabase project with URL and anon key ready for frontend integration.

**Things To Do:**
- Create a new Supabase project via supabase.com
- Copy Project URL and anon (public) key
- Add to .env.local: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
- Initialize Supabase CLI: npx supabase init
- Link to remote project: npx supabase link --project-ref REF

**Connection:** Must be done before anything else.

---

## B-2 - Database Schema (Migration 1)

**Title:** Create all tables, foreign keys, and constraints via SQL migration

**Expected Outcome:** All Supabase tables created matching dc-fms-erd.mmd.

**Things To Do:**
- Run: npx supabase migration new create_tables
- Write SQL for all 8 tables (see below)
- Create indexes for frequently queried columns

### Tables:

1. **profiles** - id uuid PK (refs auth.users), username text UNIQUE, role text, created_at timestamptz
2. **monthly_cycles** - id uuid PK, month_year text, status text (OPEN/CLOSED), created_at timestamptz
3. **labs** - id uuid PK, lab_name text
4. **case_types** - id uuid PK, name text
5. **patient_records** - id uuid PK, cycle_id uuid FK, patient_id text, entry_date date, patient_name text, address text, category text (GP/CASE), diagnosis text, total_cost integer, month_label text, lab_name text, lab_send_date date, delivery_date date, paid integer default 0, remaining integer, lab_id uuid FK, lab_fee integer default 0, lab_payment_status text default UNPAID, case_type text, teeth text, is_carried_forward boolean default false
6. **case_payments** - id uuid PK, record_id uuid FK (cascade delete), payment_date date, paid_amount integer, payment_note text, payment_status text default PAID
7. **monthly_financials** - id uuid PK, cycle_id uuid FK UNIQUE, total_gp integer default 0, total_case integer default 0, gross_income integer default 0, lab_fee integer default 0, relieving_fee integer default 0, general_expenses integer default 0, assistant_fee integer default 0, bonus integer default 0, utility_costs integer default 0, building_rent integer default 0, net_profit integer default 0, custom_overheads jsonb default '[]'::jsonb

### Indexes:
- patient_records(cycle_id), patient_records(category), patient_records(month_label)
- case_payments(record_id)
- monthly_cycles(status)

### Constraints:
- patient_records.patient_id unique per cycle_id
- monthly_financials.cycle_id UNIQUE (1:1)

**Connection:** Must be done before RLS or seed data.

---

## B-3 - Auth Setup (Migration 2)

**Title:** Set up Supabase Auth with role-based user management

**Expected Outcome:** Users sign up/sign in via Supabase Auth. User role stored in profiles table linked to auth.users.

**Things To Do:**
- Create trigger function handle_new_user() to auto-insert into profiles on auth.users insert
- Create trigger on_auth_user_created AFTER INSERT ON auth.users
- Create helper function get_user_role() returns text
- Insert seed admin user via Supabase Dashboard Auth or SQL

**Connection:** Depends on B-2. Auth must work before RLS.

---

## B-4 - RLS Policies (Migration 3)

**Title:** Configure Row Level Security for role-based access

**Expected Outcome:** Admin can read/write all data. Assistant can only read/write patient_records and case_payments. No access to financials from Assistant.

**Things To Do:**
- Enable RLS on all 7 tables
- Create policies per table (see matrix below)

### Policy Matrix:

| Table | Admin | Assistant |
|-------|-------|-----------|
| profiles | Full access | Read own only |
| monthly_cycles | Full access | Read active only |
| patient_records | Full access | Full access (active cycle) |
| case_payments | Full access | Full access (own records) |
| monthly_financials | Full access | No access |
| labs | Full access | Read only |
| case_types | Full access | Read only |

**Connection:** Depends on B-2 and B-3. Must be done before frontend uses Supabase client.

---

## B-5 - Supabase Client Setup

**Title:** Install Supabase packages and configure client utilities

**Expected Outcome:** Browser and server Supabase clients configured for Next.js App Router.

**Things To Do:**
- Install: npm install @supabase/supabase-js @supabase/ssr
- Create lib/supabase/client.ts (browser client)
- Create lib/supabase/server.ts (server client for Server Actions)
- Create lib/supabase/middleware.ts (auth session refresh)

**Connection:** Depends on B-1. Used by all frontend tasks.

---

## B-6 - Seed Data

**Title:** Create test data for development

**Expected Outcome:** Sample users, cycles, records, and financials for testing.

**Things To Do:**
- Create admin and assistant users in auth.users + profiles
- Create one OPEN cycle and one CLOSED cycle
- Seed labs (Central Lab, City Diagnostics, Health First Lab)
- Seed case_types (RPD, Crown, Bridge)
- Create 5-10 sample patient_records (mix of GP and Case)
- Create sample case_payments and monthly_financials
- Create seed.sql script

**Connection:** Depends on B-2 and B-3. Helpful for frontend testing.

---

## B-7 - DataContext Migration

**Title:** Replace all mock operations in DataContext with Supabase calls

**Expected Outcome:** Every useState + mock method replaced with real Supabase queries. App uses live database.

**Things To Do:**

### 7a. Remove mock imports and replace with Supabase queries on mount.

### 7b. Replace each mock method:

| Mock Method | Supabase Replacement |
|-------------|---------------------|
| allCycles useState | supabase.from('monthly_cycles').select('*') |
| allRecords useState | supabase.from('patient_records').select('*') |
| allPayments useState | supabase.from('case_payments').select('*') |
| allFinancials useState | supabase.from('monthly_financials').select('*') |
| users useState | supabase.from('profiles').select('*') |
| addRecord() | supabase.from('patient_records').insert() + optional case_payments.insert |
| updateRecord() | supabase.from('patient_records').update().eq('id', recordId) |
| deleteRecord() | supabase.from('patient_records').delete().eq('id', recordId) + case_payments.delete |
| addPayment() | supabase.from('case_payments').insert() + patient_records.update({paid, remaining}) |
| updateFinancials() | supabase.from('monthly_financials').upsert({cycle_id, ...updates}) |
| addCustomOverhead() | Read existing, append, upsert |
| removeCustomOverhead() | Read existing, filter out, upsert |
| toggleLock() | supabase.from('monthly_cycles').update({status}).eq('id', cycleId) |
| carryForward() | Transaction: update records + create new cycle + close old cycle |
| deleteMonth() | supabase.from('patient_records').delete().eq('cycle_id') + case_payments cascade |
| addUser() | supabase.auth.signUp() with role metadata |
| updateUser() | profiles.update() |
| deleteUser() | supabase.auth.admin.deleteUser() + profiles.delete() |

### 7c. Add data loading on mount with useEffect.

**Connection:** Depends on B-1 through B-5. This is the core integration work.

---

## B-8 - Frontend Auth Integration

**Title:** Replace mock AuthContext with Supabase Auth

**Expected Outcome:** Login uses supabase.auth.signInWithPassword(). Session via @supabase/ssr cookies. Middleware handles redirects.

**Things To Do:**
- Replace authenticateUser() with supabase.auth.signInWithPassword()
- Replace logout() with supabase.auth.signOut()
- Create middleware.ts for session refresh and role redirects
- Update signup page to use supabase.auth.signUp() with role metadata
- Update user management to use supabase.auth.admin API

**Connection:** Depends on B-3 and B-5.

---

## B-9 - Frontend Component Updates

**Title:** Update components to use real data from DataContext

**Expected Outcome:** All components work with Supabase-backed DataContext.

**Things To Do:**
- Most components already call DataContext methods - no changes needed if B-7 is done correctly
- Update user management components to use Supabase admin API
- Verify all loading/error states work with async Supabase calls

**Connection:** Depends on B-7 and B-8.

---

## B-10 - Testing and Verification

**Title:** Verify all features work with real Supabase backend

**Expected Outcome:** All 10 frontend tasks pass manual testing with live data.

**Things To Do:**
- Test login/logout with both roles
- Test record CRUD (add, edit, delete GP and Case records)
- Test payment installments and history
- Test lab fee reconciliation
- Test overhead form with custom items
- Test dashboard KPIs with real data
- Test month-end closeout (carry forward + delete)
- Test user management (admin can delete assistants)
- Verify RLS: assistant cannot access financials
- Verify RLS: assistant cannot access closeout

**Connection:** Final step after all migrations and integration.

---

## Task Dependency Graph

```
B-1 (Supabase Project)
  -> B-2 (Database Schema)
       |-> B-3 (Auth Setup)
       |    -> B-4 (RLS Policies)
       |-> B-6 (Seed Data)
            -> B-5 (Client Setup)
                 -> B-8 (Frontend Auth)
                      -> B-7 (DataContext Migration)
                           -> B-9 (Component Updates)
                                -> B-10 (Testing)
```

---

## Summary

| # | Task | Type | Est. Effort | Status |
|---|------|------|-------------|--------|
| B-1 | Supabase Project Setup | Config | 10 min | Pending |
| B-2 | Database Schema (Migration 1) | SQL | 30 min | Done (9/5/2026 11:22AM) |
| B-3 | Auth Setup (Migration 2) | SQL | 20 min | Done (9/5/2026 1:59PM) |
| B-4 | RLS Policies (Migration 3) | SQL | 30 min | Done (9/5/2026 2:37PM) |
| B-5 | Supabase Client Setup | TS Config | 15 min | Done (9/5/2026 2:45PM) |
| B-6 | Seed Data | SQL | 20 min | Done (9/5/2026 2:54PM) |
| B-7 | DataContext Migration | TS/React | 60 min | Pending |
| B-8 | Frontend Auth Integration | TS/React | 30 min | Pending |
| B-9 | Frontend Component Updates | TS/React | 20 min | Pending |
| B-10 | Testing and Verification | Manual | 30 min | Pending |

**Total estimated effort:** ~4 hours
