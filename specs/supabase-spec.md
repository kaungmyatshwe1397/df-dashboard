# Supabase Specification

## Dental Clinic Financial Management System (DC-FMS)

**Version:** 1.0
**Platform:** Supabase (PostgreSQL + Auth + RLS)
**Last Updated:** September 2026

---

## 1. Project Configuration

**File:** `supabase/config.toml`

| Setting | Value |
|---------|-------|
| Project ID | `DF_dashboard` |
| DB Port | 54322 |
| Shadow Port | 54320 |
| DB Major Version | 17 |
| API Schemas | `public`, `graphql_public` |
| Max Rows | 1000 |
| Auth Site URL | `http://127.0.0.1:3000` |
| JWT Expiry | 3600 (1 hour) |
| Enable Signup | true |
| Minimum Password Length | 6 |

---

## 2. Database Schema

### 2.1 Tables Overview

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `profiles` | User accounts (linked to `auth.users`) | 1:1 with `auth.users` |
| `monthly_cycles` | Billing period demarcation | 1:N with `patient_records` |
| `labs` | Reference table of dental labs | N:1 with `patient_records` |
| `case_types` | Reference table of case types | N:1 with `patient_records` |
| `patient_records` | Patient treatment records | N:1 with `monthly_cycles`, 1:N with `case_payments` |
| `case_payments` | Installment payments for CASE records | N:1 with `patient_records` |
| `monthly_financials` | Monthly financial summary | 1:1 with `monthly_cycles` |

### 2.2 ERD Relationships

```
USERS ||--o{ MONTHLY_CYCLES : "manages (admin)"
MONTHLY_CYCLES ||--o{ PATIENT_RECORDS : "contains"
PATIENT_RECORDS ||--o{ CASE_PAYMENTS : "installments (CASE only)"
PATIENT_RECORDS }o--|| LABS : "assigned to (CASE only)"
MONTHLY_CYCLES ||--|| MONTHLY_FINANCIALS : "summarized by"
```

---

## 3. Table Definitions

### 3.1 `profiles`

User accounts linked to Supabase Auth. Role determines access level.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, FK → `auth.users(id)` ON DELETE CASCADE | User ID |
| `email` | TEXT | UNIQUE NOT NULL | Login email |
| `username` | TEXT | UNIQUE NOT NULL | Display name |
| `role` | user_role | NOT NULL | `ADMIN` or `ASSISTANT` |
| `created_at` | TIMESTAMPTZ | DEFAULT `now()` NOT NULL | Account creation date |

**Note:** Email is stored in `profiles` for convenience. The canonical email lives in `auth.users`.

### 3.2 `monthly_cycles`

Monthly billing periods. One cycle has status OPEN at a time.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT `gen_random_uuid()` | Cycle ID |
| `month_year` | TEXT | NOT NULL | Format: `YYYY-MM` (e.g., `2026-09`) |
| `status` | cycle_status | DEFAULT `'OPEN'` NOT NULL | `OPEN` or `LOCKED` |
| `created_at` | TIMESTAMPTZ | DEFAULT `now()` NOT NULL | Creation timestamp |

### 3.3 `labs`

Reference table of dental laboratories.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT `gen_random_uuid()` | Lab ID |
| `lab_name` | TEXT | NOT NULL | Laboratory name |

### 3.4 `case_types`

Reference table of case types (RPD, Crown, Bridge).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT `gen_random_uuid()` | Case type ID |
| `name` | TEXT | NOT NULL | Type name |

### 3.5 `patient_records`

Patient treatment records. GP = single-session, Case = multi-installment with lab assignment.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT `gen_random_uuid()` | Record ID |
| `cycle_id` | UUID | FK → `monthly_cycles(id)` ON DELETE CASCADE NOT NULL | Billing cycle |
| `patient_id` | TEXT | NOT NULL | Unique per cycle (e.g., `0001/26`) |
| `entry_date` | DATE | NOT NULL | Date of record creation |
| `patient_name` | TEXT | NOT NULL | Patient full name |
| `address` | TEXT | NULLABLE | Optional address |
| `category` | record_category | NOT NULL | `GP` or `CASE` |
| `diagnosis` | TEXT | NOT NULL | Treatment description |
| `total_cost` | INTEGER | NOT NULL | Total treatment cost (in local currency units) |
| `month_label` | TEXT | NOT NULL | Display label (e.g., `Sep 2026`) |
| `lab_name` | TEXT | NULLABLE | CASE only: lab name |
| `lab_send_date` | DATE | NULLABLE | CASE only: date sent to lab |
| `delivery_date` | DATE | NULLABLE | CASE only: date delivered from lab |
| `paid` | INTEGER | DEFAULT 0 | CASE only: sum of all payments |
| `remaining` | INTEGER | NULLABLE | CASE only: `total_cost - paid` |
| `lab_id` | UUID | FK → `labs(id)` ON DELETE SET NULL | CASE only: FK to labs |
| `lab_fee` | INTEGER | DEFAULT 0 | CASE only: admin-assigned lab cost |
| `lab_payment_status` | lab_payment_status | DEFAULT `'UNPAID'` | CASE only: `PAID` or `UNPAID` |
| `case_type` | TEXT | NULLABLE | CASE only: e.g., RPD, Crown, Bridge |
| `teeth` | TEXT | NULLABLE | CASE only: comma-separated tooth numbers |
| `is_carried_forward` | BOOLEAN | DEFAULT false NOT NULL | CASE only: carried from previous month |

**Unique Constraint:** `patient_id` must be unique within a cycle.

**Index:** `idx_patient_records_patient_id_cycle` on `(patient_id, cycle_id)`

### 3.6 `case_payments`

Installment payments for CASE records. Cascade deletes with parent record.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT `gen_random_uuid()` | Payment ID |
| `record_id` | UUID | FK → `patient_records(id)` ON DELETE CASCADE NOT NULL | Parent record |
| `payment_date` | DATE | NOT NULL | Date of payment |
| `paid_amount` | INTEGER | NOT NULL | Payment amount |
| `payment_note` | TEXT | NULLABLE | Optional note |
| `payment_status` | payment_status | DEFAULT `'COMPLETED'` NOT NULL | `COMPLETED` or `INCOMPLETE` |

### 3.7 `monthly_financials`

Monthly financial summary. 1:1 with cycle.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT `gen_random_uuid()` | Financial record ID |
| `cycle_id` | UUID | UNIQUE FK → `monthly_cycles(id)` ON DELETE CASCADE NOT NULL | Linked cycle |
| `total_gp` | INTEGER | DEFAULT 0 NOT NULL | Sum of GP `total_cost` |
| `total_case` | INTEGER | DEFAULT 0 NOT NULL | Sum of CASE `total_cost` |
| `gross_income` | INTEGER | DEFAULT 0 NOT NULL | Total GP + Case revenue |
| `lab_fee` | INTEGER | DEFAULT 0 NOT NULL | Sum of all lab fees |
| `relieving_fee` | INTEGER | DEFAULT 0 NOT NULL | Doctor commission (40%) |
| `general_expenses` | INTEGER | DEFAULT 0 NOT NULL | General monthly expense |
| `assistant_fee` | INTEGER | DEFAULT 0 NOT NULL | Assistant salary |
| `bonus` | INTEGER | DEFAULT 0 NOT NULL | Performance bonus |
| `utility_costs` | INTEGER | DEFAULT 0 NOT NULL | Utility bills |
| `building_rent` | INTEGER | DEFAULT 0 NOT NULL | Clinic rent |
| `net_profit` | INTEGER | DEFAULT 0 NOT NULL | Net profit/loss |
| `custom_overheads` | JSONB | DEFAULT `'[]'::jsonb` NOT NULL | Array of `{id, name, amount}` |

---

## 4. Custom ENUM Types

```sql
CREATE TYPE user_role AS ENUM ('ADMIN', 'ASSISTANT');
CREATE TYPE cycle_status AS ENUM ('OPEN', 'LOCKED');
CREATE TYPE record_category AS ENUM ('GP', 'CASE');
CREATE TYPE lab_payment_status AS ENUM ('PAID', 'UNPAID');
CREATE TYPE payment_status AS ENUM ('COMPLETED', 'INCOMPLETE');
```

---

## 5. Indexes

| Index | Table | Columns | Purpose |
|-------|-------|---------|---------|
| `idx_patient_records_patient_id_cycle` | `patient_records` | `(patient_id, cycle_id)` | Unique patient ID per cycle |
| `idx_patient_records_cycle_id` | `patient_records` | `(cycle_id)` | Filter by billing cycle |
| `idx_patient_records_category` | `patient_records` | `(category)` | Filter GP vs CASE |
| `idx_patient_records_month_label` | `patient_records` | `(month_label)` | Filter by display month |
| `idx_patient_records_lab_payment_status` | `patient_records` | `(lab_payment_status)` | Filter by lab payment status |
| `idx_case_payments_record_id` | `case_payments` | `(record_id)` | Find payments for a record |
| `idx_monthly_cycles_status` | `monthly_cycles` | `(status)` | Find active cycle |

---

## 6. Row Level Security (RLS)

### 6.1 Policy Summary

| Table | Role | SELECT | INSERT | UPDATE | DELETE |
|-------|------|--------|--------|--------|--------|
| `profiles` | ADMIN | All profiles | Any profile | Any profile | Assistants only |
| `profiles` | ASSISTANT | Own profile only | — | — | — |
| `monthly_cycles` | ADMIN | All cycles | Any cycle | Any cycle | Any cycle |
| `monthly_cycles` | ASSISTANT | All cycles | — | — | — |
| `patient_records` | ADMIN | All records | Any record | Any record | Any record |
| `patient_records` | ASSISTANT | All records | Any record | Any record | — |
| `case_payments` | ADMIN | All payments | Any payment | Any payment | Any payment |
| `case_payments` | ASSISTANT | All payments | Any payment | Any payment | — |
| `monthly_financials` | ADMIN | All financials | Any financial | Any financial | Any financial |
| `monthly_financials` | ASSISTANT | — | — | — | — |
| `labs` | ALL | All labs | — | — | — |
| `labs` | ADMIN | All labs | Any lab | Any lab | Any lab |
| `case_types` | ALL | All types | — | — | — |
| `case_types` | ADMIN | All types | Any type | Any type | Any type |

### 6.2 Key RLS Rules

1. **`profiles`:** Assistants can only read their own profile. Admins can read all.
2. **`monthly_cycles`:** Both roles can read. Only Admin can modify.
3. **`patient_records`:** Both roles can read/insert/update. Only Admin can delete.
4. **`case_payments`:** Both roles can read/insert/update. Only Admin can delete.
5. **`monthly_financials`:** Admin ONLY. Assistants have zero access.
6. **`labs` / `case_types`:** Both roles can read. Admin can manage.

### 6.3 Role Helper Function

```sql
-- Used in all RLS policies
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

---

## 7. Authentication

### 7.1 Auth Method

- **Email + Password** (Supabase Auth)
- **No OAuth providers** configured for MVP
- **No email confirmation** (`enable_confirmations = false`)

### 7.2 Session Management

| Setting | Value |
|---------|-------|
| JWT Expiry | 3600 seconds (1 hour) |
| Refresh Token Rotation | Enabled |
| Refresh Token Reuse Interval | 10 seconds |
| Enable Signup | true |

### 7.3 Auth Flow

```
1. User signs up → auth.users created → trigger/profile insert creates profiles row
2. User signs in → Supabase returns JWT + refresh token
3. Middleware refreshes session on every request
4. RLS policies enforce role-based access at database level
```

### 7.4 User Management (Admin Only)

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Create User | `supabase.auth.signUp()` + manual profile insert | Client-side |
| Update Password | Supabase Admin API via Server Action | `app/admin/actions.ts` |
| Delete User | Supabase Admin API via Server Action | `app/admin/actions.ts` |
| Update Username | Direct `profiles` table update | Client-side |

---

## 8. Migrations

**Directory:** `supabase/migrations/`

| Migration | File | Description |
|-----------|------|-------------|
| 1 | `20260905041240_create_tables.sql` | Create all tables, ENUMs, indexes |
| 2 | `20260905065855_auth_setup.sql` | Auth trigger setup |
| 3 | `20260905073730_rls_policies.sql` | All RLS policies |
| 4 | `20260905080000_add_email_to_profiles.sql` | Add email column to profiles |
| 5 | `20260906035500_fix_auth_trigger_permissions.sql` | Fix trigger permissions |

### 8.1 Migration Commands

```bash
supabase db reset          # Reset local DB (run all migrations + seed)
supabase migration new <name>  # Create new migration
supabase db push            # Push migrations to remote
supabase db diff            # Diff local vs remote
```

---

## 9. Seed Data

**File:** `supabase/seed.sql`

Used for local development only. Seeds:
- Default admin user
- Default assistant user
- Sample labs
- Sample case types
- Sample monthly cycle

---

## 10. Supabase Client Libraries

### 10.1 Browser Client (`lib/supabase/client.ts`)

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
```

**Usage:** Client Components, browser context, `DataContext`, `AuthContext`.

### 10.2 Server Client (`lib/supabase/server.ts`)

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { /* read-only in Server Components */ }
        },
      },
    }
  );
}
```

**Usage:** Server Components, Server Actions, Route Handlers.

### 10.3 Admin Client (`lib/supabase/admin.ts`)

**Usage:** Service-role operations (user management, password changes). Server-only.

### 10.4 Middleware Client (`lib/supabase/middleware.ts`)

**Usage:** Session refresh on every request via Next.js middleware.

---

## 11. Financial Formulas

### 11.1 Revenue

```
Total GP Revenue = SUM(patient_records.total_cost WHERE category = 'GP')
Total Case Revenue = SUM(patient_records.total_cost WHERE category = 'CASE')
Total Gross Income = Total GP Revenue + Total Case Revenue
```

### 11.2 Doctor Commission

```
Commission Base = Total Gross Income - Total Lab Fees
Doctor Commission = Commission Base × 0.40
```

### 11.3 Net Profit / Loss

```
Remaining Clinic Income = Total Gross Income - Total Lab Fees - Doctor Commission
Total Operating Expenses = General Expenses + Assistant Fee + Bonus + Building Rent + Utility Costs
Net Profit / Loss = Remaining Clinic Income - Total Operating Expenses
```

### 11.4 Case Balance

```
Remaining Balance = Total Cost - SUM(CASE_payments.paid_amount)
Status = Remaining Balance == 0 ? "Payment Complete" : "In Progress"
```

---

## 12. Month-End Closeout Logic

### 12.1 Sequence

```
1. Identify all records in current cycle
2. Partition:
   - Settled: All GP records + CASE records where remaining = 0
   - Unsettled: CASE records where remaining > 0
3. For unsettled records:
   a. Create next month's cycle if not exists (status = OPEN)
   b. Update records: cycle_id → new cycle, month_label → new month, is_carried_forward = true
4. For settled records:
   a. Hard delete all case_payments (WHERE record_id IN settled)
   b. Hard delete all patient_records (WHERE id IN settled)
5. Lock current cycle (status = LOCKED)
6. Save monthly_financials summary
```

### 12.2 Carried-Forward Record State

- Preserves original `total_cost`
- Preserves historical `paid` amount
- Preserves calculated `remaining` balance
- `is_carried_forward = true` (displayed differently in UI)
- Allows staff to log subsequent installments until completion

---

## 13. Data Integrity Rules

| Rule | Enforcement |
|------|-------------|
| Patient ID unique per cycle | Unique index on `(patient_id, cycle_id)` |
| One OPEN cycle at a time | Application-level check |
| CASE records must have `lab_name` | Application-level validation |
| GP records cannot have lab fields | TypeScript discriminant type (`GPPatientRecordType` vs `CasePatientRecordType`) |
| Payments cannot exceed total cost | Application-level validation |
| `monthly_financials` 1:1 with cycle | UNIQUE constraint on `cycle_id` |
| Cascade deletes | FK constraints with `ON DELETE CASCADE` |

---

## 14. Environment Variables

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client + Server | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Admin operations (bypass RLS) |

---

## 15. Local Development

### 15.1 Start Local Supabase

```bash
supabase start          # Start local stack (DB, Auth, Studio, API)
supabase stop           # Stop local stack
supabase reset          # Reset DB (migrations + seed)
supabase status         # Check running services
```

### 15.2 Local Ports

| Service | Port |
|---------|------|
| API (PostgREST) | 54321 |
| Database (PostgreSQL) | 54322 |
| Studio | 54323 |
| Inbucket (Email) | 54324 |
| Analytics | 54327 |

### 15.3 Supabase Studio

Access at `http://localhost:54323` to:
- Browse tables and data
- View RLS policies
- Manage auth users
- Run SQL queries
- Monitor logs

---

## 16. Production Deployment

### 16.1 Supabase Cloud

| Setting | Value |
|---------|-------|
| Plan | Free Tier |
| Region | Choose nearest to Vercel deployment |
| Connection Pooling | PgBouncer (transaction mode) |

### 16.2 Deployment Steps

1. Create Supabase project on cloud
2. Link local project: `supabase link --project-ref <ref>`
3. Push migrations: `supabase db push`
4. Apply seed data (manual or via Studio)
5. Set environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 16.3 RLS Verification

After deployment, verify RLS is enabled on all tables:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

All tables should show `rowsecurity = true`.
