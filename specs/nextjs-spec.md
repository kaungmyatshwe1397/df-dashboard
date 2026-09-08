# Next.js Frontend & Backend Specification

## Dental Clinic Financial Management System (DC-FMS)

**Version:** 1.0
**Framework:** Next.js 16 (App Router)
**Last Updated:** September 2026

---

## 1. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16.3.3 (App Router) | Full-stack React framework |
| UI Library | React 19.2.8 | Component rendering |
| Styling | Tailwind CSS 4 + `tw-animate-css` | Utility-first CSS |
| UI Components | shadcn/ui (Radix-based) | Accessible component primitives |
| Icons | Lucide React | SVG icon library |
| Build | Vite (Turbopack) | Fast dev/build |
| Testing | Vitest 4 + Testing Library | Unit & component tests |
| Linting | ESLint 9 + eslint-config-next | Code quality |
| Language | TypeScript 5 | Type safety |

---

## 2. Project Structure

```
df-dashboard/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (providers, fonts, Sidebar)
│   ├── page.tsx                  # Root redirect → /login or /assistant
│   ├── globals.css               # Tailwind base + design tokens (CSS vars)
│   ├── login/                    # Login page
│   ├── signup/                   # Signup page
│   ├── assistant/                # Assistant portal
│   │   └── page.tsx              # Record table (GP + Case tabs)
│   ├── admin/                    # Admin portal
│   │   ├── page.tsx              # Dashboard with KPIs
│   │   └── actions.ts            # Server Actions (user management)
│   ├── admin-reconciliation/     # Lab fee assignment
│   │   └── page.tsx
│   └── admin-overhead/           # Overhead & expense input
│       └── page.tsx
├── components/
│   ├── ui/                       # shadcn/ui primitives (Button, Dialog, Table, etc.)
│   ├── layout/                   # Sidebar, AppShell, Header
│   ├── records/                  # RecordTable, RecordForm, PaymentDialog
│   ├── dashboard/                # KPICards, FinancialSummary
│   ├── reconciliation/           # LabReconciliationTable
│   ├── overhead/                 # OverheadForm
│   ├── closeout/                 # MonthCloseoutDialog
│   ├── users-table/              # UserManagementTable
│   └── shared/                   # DateInput, CurrencyDisplay, Badge, Skeleton
├── context/
│   ├── AuthContext.tsx            # Auth state + login/logout
│   └── DataContext.tsx            # Data state + CRUD operations
├── lib/
│   ├── global.ts                 # TypeScript enums & interfaces (types)
│   ├── utils.ts                  # cn() helper, formatters
│   ├── mock-data.ts              # Mock data (Phase 1 dev only)
│   └── supabase/
│       ├── client.ts              # Browser client (@supabase/ssr)
│       ├── server.ts              # Server client (cookies-based)
│       ├── admin.ts               # Service-role client (Admin only)
│       └── middleware.ts          # Session refresh + RBAC enforcement
├── middleware.ts                  # Next.js middleware (route protection)
├── tokens.css                    # Design token CSS variables
├── tailwind.config.ts            # Tailwind config (if needed)
└── components.json               # shadcn/ui config
```

---

## 3. App Router Route Structure

### 3.1 Public Routes

| Route | Component | Auth Required | Description |
|-------|-----------|---------------|-------------|
| `/login` | LoginPage | No | Email + password login |
| `/signup` | SignupPage | No | New user registration |

### 3.2 Protected Routes — Assistant

| Route | Component | Auth Required | Description |
|-------|-----------|---------------|-------------|
| `/assistant` | RecordTable | Yes (any role) | Daily patient records (GP + Case tabs) |

### 3.3 Protected Routes — Admin Only

| Route | Component | Auth Required | Description |
|-------|-----------|---------------|-------------|
| `/admin` | Dashboard | Admin only | Financial KPIs, summary |
| `/admin-reconciliation` | LabReconciliation | Admin only | Assign lab fees to cases |
| `/admin-overhead` | OverheadForm | Admin only | Monthly expenses input |

---

## 4. Middleware & Route Protection

**File:** `middleware.ts`

### 4.1 Route Matching

```typescript
const adminRoutes = ["/admin"];
const assistantRoutes = ["/assistant"];
const protectedRoutes = [...adminRoutes, ...assistantRoutes];
```

### 4.2 RBAC Logic

1. Unauthenticated users → redirect to `/login`
2. Non-admin users hitting `/admin/*` → redirect to `/assistant`
3. Authenticated users hitting `/assistant/*` → allowed
4. Public routes (`/login`, `/signup`) → no redirect

### 4.3 Session Refresh

The middleware calls `updateSession()` from `lib/supabase/middleware.ts` on every request to:
- Refresh the Supabase auth token via cookies
- Extract user role from the `profiles` table
- Return `{ supabaseResponse, user, role }`

---

## 5. Authentication Flow

### 5.1 Auth Provider (`context/AuthContext.tsx`)

**State:**

```typescript
interface AuthUser {
  id: string;
  username: string;
  role: UserRole; // "ADMIN" | "ASSISTANT"
}
```

**Methods:**

| Method | Description |
|--------|-------------|
| `login(email, password)` | Calls `supabase.auth.signInWithPassword()`, fetches profile |
| `logout()` | Calls `supabase.auth.signOut()`, clears user state |

**Session Persistence:**
- `onAuthStateChange` listener for real-time session updates
- `getSession()` on mount to restore existing session
- Cookies managed via `@supabase/ssr` for SSR/CSR compatibility

### 5.2 Login Flow

```
User enters email + password
  → supabase.auth.signInWithPassword({ email, password })
  → On success: fetch profiles table for username + role
  → Set AuthUser state
  → Redirect based on role:
      ADMIN → /admin
      ASSISTANT → /assistant
```

### 5.3 Signup Flow

```
User enters email + password + username
  → supabase.auth.signUp({ email, password, options: { data: { username, role } } })
  → Manual INSERT into profiles table (trigger unreliable on hosted Supabase)
  → Redirect to /login
```

---

## 6. Data Layer (`context/DataContext.tsx`)

### 6.1 State Management

All application state is managed via React Context (no Redux/Zustand). The `DataContext` provides:

**Core State:**

| State | Type | Description |
|-------|------|-------------|
| `cycle` | `MonthlyCycle \| null` | Active (OPEN) billing cycle |
| `records` | `PatientRecord[]` | Current month's records |
| `payments` | `CasePayment[]` | All installment payments |
| `financials` | `MonthlyFinancials \| null` | Current month's financial summary |
| `labs` | `Lab[]` | Lab reference data |
| `caseTypes` | `CaseType[]` | Case type reference data |
| `users` | `User[]` | All user profiles |
| `cycleLocked` | `boolean` | Whether current cycle is LOCKED |
| `loading` | `boolean` | Data fetch in progress |
| `error` | `string \| null` | Error message |

### 6.2 Data Fetching

**Initial Load (parallel queries):**

```typescript
const [cyclesRes, recordsRes, paymentsRes, financialsRes, labsRes, caseTypesRes, usersRes] = 
  await Promise.all([
    supabase.from("monthly_cycles").select("*"),
    supabase.from("patient_records").select("*"),
    supabase.from("case_payments").select("*"),
    supabase.from("monthly_financials").select("*"),
    supabase.from("labs").select("*"),
    supabase.from("case_types").select("*"),
    supabase.from("profiles").select("id, username, email, role"),
  ]);
```

**Refresh:** `refreshData()` triggers a full re-fetch by incrementing a `refreshKey`.

### 6.3 CRUD Operations

| Operation | Method | Supabase Table | Notes |
|-----------|--------|----------------|-------|
| Add Record | `addRecord()` | `patient_records` + `case_payments` | Auto-sets `entry_date`, `month_label`, `cycle_id` |
| Update Record | `updateRecord()` | `patient_records` | Partial update via `PATCH` |
| Delete Record | `deleteRecord()` | `case_payments` + `patient_records` | Cascade: deletes payments first, then record |
| Add Payment | `addPayment()` | `case_payments` + `patient_records` | Updates `paid` and `remaining` on parent record |
| Update Financials | `updateFinancials()` | `monthly_financials` | Upsert: creates if not exists |
| Add Custom Overhead | `addCustomOverhead()` | `monthly_financials` | Appends to `custom_overheads` JSONB array |
| Remove Custom Overhead | `removeCustomOverhead()` | `monthly_financials` | Filters out from `custom_overheads` array |

### 6.4 Month-End Operations

| Operation | Method | Description |
|-----------|--------|-------------|
| Toggle Lock | `toggleLock()` | Switches cycle between OPEN ↔ LOCKED |
| Carry Forward | `carryForward()` | Moves unsettled CASE records to next month's cycle |
| Delete Month | `deleteMonth()` | Hard-deletes all records + payments, locks cycle |

---

## 7. Component Architecture

### 7.1 Layout Components

**Root Layout (`app/layout.tsx`):**

```typescript
// Wraps entire app with providers and Sidebar
// AuthProvider → DataProvider → Sidebar + children
```

**Sidebar (`components/layout/`):**

| Sidebar Item | Route | Roles |
|-------------|-------|-------|
| Dashboard | `/admin` | ADMIN |
| Lab Reconciliation | `/admin-reconciliation` | ADMIN |
| Overhead | `/admin-overhead` | ADMIN |
| User Management | (dialog) | ADMIN |
| Records | `/assistant` | ALL |

### 7.2 Record Table (`components/records/`)

**Tab Structure:**

| Tab | Filter | Columns |
|-----|--------|---------|
| GP Records | `category === "GP"` | Entry Date, Patient Name, Diagnosis, Total Cost |
| Case Records | `category === "CASE"` | Entry Date, Patient Name, Diagnosis, Lab, Total Cost, Balance, Status, Carried Forward |

**Row Actions:**

| Action | Component | Description |
|--------|-----------|-------------|
| Edit | `RecordForm` (dialog) | Prefill form with record data |
| Record Payment | `PaymentDialog` | Add installment payment (CASE only) |
| View History | Expand row | Show payment installments |
| Delete | Confirmation dialog | Admin only, locked cycle disallowed |

### 7.3 Dashboard (`components/dashboard/`)

**KPI Cards:**

| KPI | Formula | Visibility |
|-----|---------|------------|
| Total GP Revenue | Sum of GP `total_cost` | Admin only |
| Total Case Revenue | Sum of CASE `total_cost` | Admin only |
| Total Lab Fees | Sum of CASE `lab_fee` | Admin only |
| Doctor Commission | `(Gross - Lab Fees) × 0.40` | Admin only |
| Operating Overhead | Sum of all expenses | Admin only |
| Net Profit/Loss | `Remaining Income - Total Expenses` | Admin only |

### 7.4 Lab Reconciliation (`components/reconciliation/`)

- Filter by lab name (dropdown)
- Display all CASE records with `lab_fee` input fields
- Auto-aggregate total lab fees
- Only visible to ADMIN

### 7.5 Overhead Form (`components/overhead/`)

**Fields:**

| Field | Type | Database Column |
|-------|------|-----------------|
| General Monthly Expense | Number | `general_expenses` |
| Assistant Salary | Number | `assistant_fee` |
| Performance Bonus | Number | `bonus` |
| Clinic Rent | Number | `building_rent` |
| Utility Bills | Number | `utility_costs` |
| Custom Overheads | Array | `custom_overheads` (JSONB) |

### 7.6 Month Closeout (`components/closeout/`)

**Two-Step Confirmation:**

1. **Preview:** Show summary of settled vs. unsettled records
2. **Confirm:** Execute carry-forward → hard delete → lock cycle → open new cycle

---

## 8. Server Actions

**File:** `app/admin/actions.ts`

| Action | Description |
|--------|-------------|
| `updateUserAction(userId, { password? })` | Admin-only: update user password via Supabase Admin API |
| `deleteUserAction(userId)` | Admin-only: delete user from `auth.users` + `profiles` |

---

## 9. Design System Integration

### 9.1 Design Tokens (`tokens.css`)

All CSS variables follow the 8pt grid system and Perfect Fifth type scale:

```css
/* Spacing */
--space-1: 4px;   --space-2: 8px;   --space-3: 16px;
--space-4: 24px;  --space-5: 32px;  --space-6: 40px;
--space-7: 48px;  --space-8: 64px;

/* Typography */
--font-body: 16px;  --font-body-sm: 14px;  --font-caption: 12px;
--font-h1: 36px;    --font-h2: 24px;       --font-h3: 18px;

/* Colors (Light Mode) */
--color-surface-primary: #FFFFFF;
--color-text-primary: #0F172A;
--color-action-primary: #4F46E5;
--color-success: #059669;
--color-danger: #DC2626;
```

### 9.2 shadcn/ui Components

All UI elements use shadcn primitives. Never build custom components when shadcn provides them.

**Required shadcn Components:**

| Component | Usage |
|-----------|-------|
| Button | Form submissions, actions |
| Input | Text/number fields |
| Label | Form labels |
| Card | KPI cards, content sections |
| Dialog | Forms, confirmations |
| Table | Record tables |
| Badge | Status indicators |
| Alert | Error/success messages |
| Select | Dropdowns (lab, category) |
| Textarea | Notes, descriptions |
| Skeleton | Loading states |
| Sidebar | App navigation |
| Separator | Section dividers |
| Pagination | Large record lists |
| Progress | Case completion |
| RadioGroup | Category selection |
| Tabs | GP/Case record views |

---

## 10. Type System

**File:** `lib/global.ts`

### 10.1 Enums

```typescript
enum UserRole     { ADMIN, ASSISTANT }
enum CycleStatus  { OPEN, LOCKED }
enum RecordCategory { GP, CASE }
enum LabPaymentStatus { PAID, UNPAID }
enum PaymentStatus { PAID = "COMPLETED", UNPAID = "INCOMPLETE" }
```

### 10.2 Core Interfaces

```typescript
interface PatientRecordBaseType {
  id, cycle_id, patient_id, entry_date, patient_name,
  address?, category, diagnosis, total_cost, month_label
}

interface GPPatientRecordType extends PatientRecordBaseType {
  category: GP  // No lab/financial fields
}

interface CasePatientRecordType extends PatientRecordBaseType {
  category: CASE
  case_type?, teeth?, lab_name, lab_send_date?, delivery_date?,
  paid?, remaining?, lab_id?, lab_fee?, lab_payment_status?,
  is_carried_forward
}

type PatientRecord = GPPatientRecordType | CasePatientRecordType
```

### 10.3 Relationship Types

```typescript
interface PatientRecordWithPayments extends CasePatientRecordType {
  case_payments: CasePayment[]
}

interface MonthlyCycleWithRecords extends MonthlyCycle {
  patient_records: PatientRecord[]
}

interface DashboardKPIs {
  total_gp_revenue, total_case_revenue, total_lab_fees,
  doctor_commission, operating_overhead, net_profit_loss
}
```

---

## 11. Mobile Responsive Strategy

- All layouts must be responsive (mobile-first)
- Sidebar collapses to hamburger on mobile
- Tables become scrollable horizontally on small screens
- Dialogs stack vertically on mobile
- Forms use full-width inputs on mobile

---

## 12. Testing Strategy

### 12.1 Unit Tests (Vitest)

| Category | Files |
|----------|-------|
| Utility functions | `lib/__tests__/utils.test.ts` |
| Context logic | `context/__tests__/AuthContext.test.ts`, `DataContext.test.ts` |
| Financial calculations | `lib/__tests__/calculations.test.ts` |

### 12.2 Component Tests (Testing Library)

| Component | Test File |
|-----------|-----------|
| RecordTable | `components/__tests__/records/RecordTable.test.tsx` |
| RecordForm | `components/__tests__/records/RecordForm.test.tsx` |
| PaymentDialog | `components/__tests__/records/PaymentDialog.test.tsx` |
| Dashboard | `components/__tests__/dashboard/Dashboard.test.tsx` |
| Sidebar | `components/__tests__/layout/Sidebar.test.tsx` |

### 12.3 Test Commands

```bash
npm run test        # Single run
npm run test:watch  # Watch mode
```

---

## 13. Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only: admin operations |

---

## 14. Build & Deployment

| Command | Description |
|---------|-------------|
| `npm run dev` | Local development (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript type check |

**Deployment Target:** Vercel (serverless, auto-deploy from git)
