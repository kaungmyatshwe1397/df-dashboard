# DC-FMS Frontend Build Plan

> **Tech Stack:** Next.js App Router · Tailwind CSS · Lucide React Icons · shadcn/ui
> **Reference:** `tokens.md` · `dc-fms-user-flow.mermaid` · `dc-fms-erd.mmd` · `dc-fms-ui-states-checklist.md` · `prd.md`
> **Backend:** See `backend-draft-plan.md` for Supabase project setup, schema, RLS, and client configuration.
> **Note:** All data operations use mock/ideal state. Supabase integration will replace mocks in a later phase.

---

## Task 1 — Project Scaffolding (Completed 9/1/2026 11:25AM)

**Title:** Initialize Next.js project with Tailwind CSS and shadcn/ui

**Expected Outcome:** A running Next.js dev server with Tailwind configured, shadcn/ui components installed, and the `tokens.css` file imported in the global stylesheet.

**Things To Do:**
- ✅ `npx create-next-app@latest` with App Router, TypeScript, Tailwind CSS
- ✅ Run `npx shadcn@latest init` to set up shadcn/ui
- ✅ Install shadcn components: `npx shadcn@latest add button input label card dialog table badge alert select textarea skeleton sidebar separator pagination progress radio-group`
- ✅ Move `tokens.css` into `app/globals.css` or import it — all CSS variables available in `:root`
- ✅ Add Inter font via `next/font/google`
- ✅ Verify dev server runs, Tailwind classes work, and CSS tokens are accessible

**Backup Plan Remarks:**
- Project uses Next.js App Router — all pages under `app/` directory
- shadcn/ui components are in `components/ui/` — import from `@/components/ui/`
- Tailwind CSS v4 uses `@theme` directive for custom tokens
- `tokens.css` is imported in `globals.css` — CSS variables available globally

**Note:** Supabase client setup (`@supabase/supabase-js`, `@supabase/ssr`, `lib/supabase/*`) is handled in `backend-draft-plan.md` (B-4).

**Connection:** Foundation for all subsequent tasks. No prior work.

**Next Step →** Task 2

---

## Task 2 — TypeScript Types from ERD (Completed 9/1/2026 11:25AM)

**Title:** Generate TypeScript interfaces for all data models

**Expected Outcome:** A `lib/global.ts` file with typed interfaces for `User`, `MonthlyCycle`, `PatientRecord`, `CasePayment`, `MonthlyFinancials`, `Lab` — matching the ERD exactly.

**Things To Do:**
- ✅ Read `dc-fms-erd.mmd` and translate each table into a TypeScript interface
- ✅ Define enums: `UserRole` (ADMIN/ASSISTANT), `CycleStatus` (OPEN/CLOSED), `RecordCategory` (GP/CASE), `LabPaymentStatus` (PAID/UNPAID), `PaymentStatus` (PAID/UNPAID)
- ✅ Define relationship types (e.g. `PatientRecordWithPayments` has `CasePayment[]`)
- ✅ Create a `MockData` type that mirrors the shape of Supabase query results (for easy swap later)

**Backup Plan Remarks:**
- All types are in `lib/global.ts` — single source of truth for data models
- `MockData` type mirrors Supabase query results — swap context with Supabase client later
- Enums are string-based — compatible with Supabase enum columns
- Relationship types are optional extensions — use when needed for nested queries

**Connection:** Depends on Task 1 (project exists). Types are used by every screen in Tasks 5–8.

**Next Step →** Task 3

---

## Task 3 — Auth & Login Page (Completed 9/1/2026 11:45AM)

**Title:** Build login page with mock authentication and role-based redirect

**Expected Outcome:** A functional login page that authenticates via mock state, reads the user's role, and redirects to `/assistant` or `/admin`. Handles all 5 UI states from the checklist.

**Things To Do:**
- ✅ Create `app/page.tsx` as redirect to `/login`
- ✅ Build `app/login/page.tsx` with username + password form using shadcn `Card`, `Input`, `Label`, `Button`, `Alert`
- ✅ Implement mock auth — use a hardcoded credential check (e.g. `admin/admin123`, `assistant/assist123`) stored in `lib/mock-data.ts`
- ✅ On success, store user role in React context or `useState` → redirect `/admin` or `/assistant`
- ✅ On failure, show inline error using shadcn `Alert` (never reveal which field was wrong)
- ✅ Implement all 5 states: ideal, empty (blank form), loading (shadcn `Skeleton`), error (inline `Alert`), edge case (long input, caps lock)
- ✅ Create a simple `AuthContext` to hold the logged-in user and role (no middleware, no cookies)
- ⏳ After Supabase integration, replace context with `@supabase/ssr` session

**Backend Plan Remarks:**
- Mock auth uses hardcoded credentials in `lib/mock-data.ts` for easy replacement
- `AuthContext` is isolated — swap `authenticateUser()` with Supabase `signInWithPassword()`
- No cookies/session management yet — `@supabase/ssr` middleware will handle this
- Role-based redirect logic is already in place — just need to connect to real user data

**Connection:** First user-facing screen. Foundation for all portal access.

**Next Step →** Task 4

---

## Task 4 — Layout Shells (Assistant + Admin) (Completed 9/1/2026)

**Title:** Create role-specific layout components with sidebar/header navigation

**Expected Outcome:** Two layout wrappers — `AssistantLayout` and `AdminLayout` — each with a sidebar showing only the navigation items that role can access (per PRD Section 2).

**Things To Do:**
- ✅ Create `components/layout/AppSidebar.tsx` with navigation links using shadcn `Sidebar`, `Button`, `Badge`, `Separator`
- ✅ Create `app/assistant/layout.tsx` — sidebar links: "Record Table", "Add Entry" (hide financial links)
- ✅ Create `app/admin/layout.tsx` — sidebar links: "Dashboard", "Lab Reconciliation", "Overhead", "Closeout"
- ✅ Add user info display (username, shadcn `Badge` for role) and logout `Button` in sidebar footer
- ✅ Use Lucide icons for nav items
- ✅ Style using Tailwind + tokens (spacing, colors, typography)
- ✅ Handle locked cycle state — visually indicate when cycle is locked in the layout
- ✅ Read cycle lock state from mock data context (passed as `cycleLocked` prop, ready for DataContext)

**Backup Plan Remarks:**
- `AppSidebar` is a single shared component that accepts `cycleLocked` prop — avoids duplication
- `SidebarMenuButton` uses `render` prop pattern (not `asChild`) — compatible with shadcn/ui base-nova style
- Layouts redirect unauthorized users (assistant → `/assistant`, admin → `/admin`) using `useEffect`
- Placeholder `page.tsx` files created for all routes — ready for Tasks 5–10 to replace
- `TooltipProvider` not wrapped yet — add to root layout if tooltips are needed later

**Backend Plan Remarks:**
- Layout redirect logic uses mock `AuthContext` — swap with `@supabase/ssr` session check in middleware
- `cycleLocked` prop will read from Supabase `monthly_cycles` table where `status = 'CLOSED'`
- Logout button calls `useAuth().logout()` — replace with `supabase.auth.signOut()`
- Role-based nav filtering stays on client — Supabase RLS enforces server-side access control
- No server-side data fetching in layouts yet — `getActiveCycle()` call will move to layout or page-level query
- Sidebar nav items are hardcoded per role — consider fetching allowed routes from a `user_roles` or config table if roles expand

**Connection:** Depends on Task 3 (auth/role). Provides shell for Tasks 5–8.

**Next Step →** Task 5

---

## Task 5 — Assistant Portal: Active Cycle Record Table (Completed 9/2/2026)

**Title:** Build the main data entry table showing current cycle patient records

**Expected Outcome:** A tabbed table (GP Records | Case Records) showing current cycle patient records, with carried-forward records visually flagged. Handles all 5 UI states. Read-only when cycle is locked.

**Things To Do:**
- ✅ Create `app/assistant/page.tsx` as the default assistant view
- ✅ Read patient records from mock data context (pre-seeded sample records for the active cycle)
- ✅ Build `components/RecordTable.tsx` with shadcn `Tabs` — two tabs: GP Records and Case Records
- ✅ GP tab columns: Date, Patient Name, Diagnosis, Total Cost
- ✅ Case tab columns: Date, Patient Name, Diagnosis, Total Cost, Paid, Balance, Status
- ✅ Flag carried-forward records with a shadcn `Badge` (`is_carried_forward = true`) — Case tab only
- ✅ Show "Payment Complete" shadcn `Badge` when `balance = 0` — Case tab only
- ✅ GP records show no status column (single-session, no installments)
- ✅ Each tab has its own "Add Record" shadcn `Button`
- ✅ Implement shadcn `Skeleton` loading state
- ✅ Implement empty state per tab: "No GP/Case records yet this cycle" + shadcn `Button` Add
- ✅ Implement error state: shadcn `Button` retry
- ✅ Implement edge case: long names truncate with ellipsis, large row count with `Pagination` per tab
- ✅ When cycle is locked → hide edit icons, show read-only indicator on both tabs
- ✅ Installed shadcn `Tabs` component

**Connection:** Depends on Task 4 (layout). Data source for Admin Dashboard (Task 7).

**Next Step →** Task 6

---

## Task 6 — Assistant Portal: Add/Edit Patient Record (Completed 9/2/2026 12:30PM)

**Title:** Build the modal form for creating and editing patient records

**Expected Outcome:** Two separate forms (GP and Case) with a two-step lookup flow for editing. Validates all fields and handles all 5 UI states.

**Things To Do:**
- ✅ Create `components/records/RecordFormFields.tsx` — GP form (Patient ID, Name, Address, Diagnosis, Total Cost)
- ✅ Create `components/records/CaseFormFields.tsx` — Case form (Patient ID, Name, Address, Diagnosis, Total Cost, Lab Name, Lab Send Date, Delivery Date, Paid, Remaining)
- ✅ Create `components/records/PatientRecordUpdateForm.tsx` — Dialog with two-step lookup flow
- ✅ Create `components/records/FormField.tsx` — Reusable Label + Input + error wrapper
- ✅ Patient ID field added (format: `0001/26`) for both GP and Case
- ✅ Category removed from form — determined by which tab the user opened from
- ✅ Two-step edit flow: search by Patient ID → form appears pre-filled with record data
- ✅ GP search only finds GP records, Case search only finds Case records (prevents cross-matching)
- ✅ "Balance" renamed to "Remaining" in Case table for clarity
- ✅ Delete functionality in edit mode removes record and associated payments
- ✅ Validation: required fields, Paid <= Total Cost, numeric values valid
- ✅ Save via context state update — `updateRecord()` for edits, `addRecord()` for new records
- ✅ Loading state: spinner on save/search/delete buttons, dialog not closable mid-save
- ✅ Error state: inline field errors, Patient ID not found message, network error alert
- ✅ Edge case: Patient exists in both GP and Case tabs (separate records), decimals, long text wraps
- ✅ When cycle is locked → dialog does not open, edit is blocked
- ✅ Scrollable form container (`max-h-[60vh]`) for Case form's 10 fields
- ✅ Wider dialog (`sm:max-w-lg`) to accommodate more fields

**Backend Plan Remarks:**
- Mock `addRecord()` creates `PatientRecord` + initial `CasePayment` for CASE — replace with Supabase `insert` into `patient_records` and `case_payments`
- Mock `updateRecord()` patches record in context — replace with Supabase `update` on `patient_records`
- Mock `deleteRecord()` removes record + payments — replace with Supabase `delete` with cascade or manual cleanup
- Mock `findRecordByPatientId()` filters active records by `patient_id` and category — replace with Supabase `select` with `eq` filter
- `patient_id` is user-entered (format `NNNN/YY`) — add unique constraint per cycle in Supabase
- `lab_name`, `lab_send_date`, `delivery_date`, `paid`, `remaining` are new Case-only fields — map to `patient_records` columns
- Form validation stays client-side — Supabase RLS + DB constraints provide server-side enforcement
- Dialog uses `@base-ui/react` Dialog primitives (not Radix) — consistent with shadcn `base-nova` style

**Connection:** Depends on Task 5 (table). Creates data that Task 7 (Admin Dashboard) reads.

**Next Step →** Task 6.1

---

## Task 6.1 — Assistant Portal: Case Payment Installments & History (Completed 9/2/2026 6:16PM)

**Title:** Add payment recording dialog, expandable payment history, and per-case payment flow

**Expected Outcome:** A "Pay" button in each case row opens a separate payment dialog. Case rows expand to show full payment history. `addPayment()` syncs record totals. Case data remains editable via existing edit form.

**Things To Do:**
- ✅ Create `components/records/PaymentDialog.tsx` — dialog with fields: Payment Date (date picker, default today), Remaining Balance (read-only), Paid Amount (number, min=0, max=remaining), Note (optional text)
- ✅ PaymentDialog validates: paid > 0, paid <= remaining, date required
- ✅ PaymentDialog calls `addPayment()` from DataContext on save
- ✅ Modify `components/records/CaseTable.tsx` — add "Pay" button (with `CircleDollarSign` icon) per row when `remaining > 0`
- ✅ Add expand/collapse chevron icon per row to toggle payment history
- ✅ Track expanded row state (single row expanded at a time)
- ✅ Create `components/records/PaymentHistoryRow.tsx` — collapsible sub-row showing payment history table (Date, Amount, Note, Status columns)
- ✅ PaymentHistoryRow reads from `getPaymentsForRecord()` via DataContext
- ✅ Modify `context/DataContext.tsx` — after `addPayment()`, also update the parent record's `paid` and `remaining` fields so CaseTable reflects totals immediately
- ✅ Verify existing edit flow in `PatientRecordUpdateForm.tsx` still works (already supports editing case records via Patient ID lookup)
- ✅ Loading state: spinner on PaymentDialog save button, dialog not closable mid-save
- ✅ Error state: inline error in PaymentDialog if save fails
- ✅ Edge case: remaining = 0 → hide Pay button, show "Payment Complete" badge (already handled), no expand needed
- ✅ Edge case: paid amount > remaining → validation error blocks save
- ✅ Empty state: no payments yet → PaymentHistoryRow shows "No payments recorded"

**Business Logic:**
- When `remaining` becomes 0 after a payment, CaseTable badge changes to "Payment Complete"
- When `remaining > 0`, badge stays "Incomplete" and "Pay" button remains enabled
- Initial payment on record creation already works via `addRecord()` with `initialPayment` — this task handles subsequent installments
- Payment history shows all installments chronologically per case

**Backend Plan Remarks:**
- Mock `addPayment()` creates `CasePayment` in context — replace with Supabase `insert` into `case_payments`
- Updating parent record's `paid`/`remaining` after payment — replace with Supabase `update` on `patient_records` (or use a DB trigger/function)
- `getPaymentsForRecord()` filters payments by `record_id` — replace with Supabase `select` with `eq` filter
- Payment status `COMPLETED`/`INCOMPLETE` drives carry-forward logic in Task 10

**Connection:** Depends on Task 6 (edit form exists). Enhances Task 5 (CaseTable). Feeds into Task 7 (Dashboard reads paid amounts) and Task 10 (Closeout uses payment status).

**Next Step →** Task 6.2

---

## Task 6.2 — Shared Record Table: Admin Access to Assistant Portal (Completed 9/2/2026 6:16PM)

**Title:** Make the Record Table and all its actions (Add, Edit, Pay, History) accessible to Admin role

**Expected Outcome:** Admin sidebar includes a "Records" link. Clicking it opens the same Record Table with full Add/Edit/Pay/History capabilities. Admin has identical record management access as Assistant, plus admin-only modules.

**Things To Do:**
- ✅ Add "Records" nav item to `adminNavItems` in `components/layout/AppSidebar.tsx` — href: `/admin/records`, icon: `TableProperties`
- ✅ Create `app/admin/records/page.tsx` — mirrors `app/assistant/page.tsx` structure (RecordTable + PatientRecordUpdateForm), uses `PortalLayout requiredRole="ADMIN"`
- ✅ Ensure RecordTable, PatientRecordUpdateForm, CaseFormFields, PaymentDialog all work under admin layout (no role restrictions on record actions)
- ✅ Cycle lock behavior consistent — admin sees same read-only state when cycle is locked
- ✅ Verify Add, Edit, Pay, History actions all function identically for admin and assistant

**Backend Plan Remarks:**
- No new data operations — reuses existing context methods (`addRecord`, `updateRecord`, `addPayment`, etc.)
- Admin access to records is already allowed in PRD Section 2 ("Full Access" for daily patient data entry)
- RLS policies will grant admin full CRUD on `patient_records` and `case_payments`

**Connection:** Depends on Tasks 5, 6, 6.1 (record table, edit form, payment flow all built). Provides shared access for Task 7 (Dashboard reads same data).

**Next Step →** Task 7

---

## Task 7 — Admin Portal: Live Financial Dashboard (Completed 9/2/2026 9:15PM)

**Title:** Build the admin dashboard with real-time KPI cards

**Expected Outcome:** A dashboard showing all financial KPIs — Total GP Revenue, Total Case Revenue, Lab Deductions, Doctor Commission (40%), Operating Overhead, Net Profit/Loss — with correct formatting and color coding.

**Things To Do:**
- ✅ Create `app/admin/page.tsx` as the default admin view
- ✅ Read all data from mock data context (patient records, case payments, monthly financials)
- ✅ Build `components/KpiCard.tsx` using shadcn `Card`, `Badge`, `Separator` — reusable card with label, value, optional icon
- ✅ Calculate per PRD formulas (computed from mock state, not Supabase queries):
  - `Total GP Revenue` = sum of GP records total_cost
  - `Total Case Revenue` = sum of Case records paid amounts (cash flow)
  - `Total Lab Fees` = sum of lab_fee from imput by admin manually.
  - `Doctor Commission` = (Gross Income - Lab Fees) * 0.40
  - `Operating Overhead` = general_expenses + assistant_fee + bonus + building_rent + utility_costs ( not only total , show each seaprate amount too)
  - `Net Profit/Loss` = Remaining Clinic Income - Operating Expenses
- ✅ Color code using shadcn `Badge`: Net Profit = green, Net Loss = red, Zero = neutral
- ✅ Format currency with thousands separators, 2 decimal places
- ✅ Loading state: shadcn `Skeleton` KPI cards
- ✅ Error state: per-card error with shadcn `Button` retry
- ✅ Edge case: zero values show "0.00", large numbers don't break card width

**Backend Plan Remarks:**
- `DashboardKPIs` computes all KPIs live from `records` and `payments` context — replace with Supabase queries using `select` with `eq` filter on `cycle_id`
- GP Revenue uses `patient_records` where `category = 'GP'` — replace with Supabase query `select('total_cost').eq('category', 'GP').eq('cycle_id', cycleId)`
- Case Revenue sums `case_payments.paid_amount` for case records in active cycle — replace with Supabase join or filtered select
- Lab Fees sum `patient_records.lab_fee` for case records — replace with Supabase query on `patient_records` table
- Operating Overhead reads from `monthly_financials` — replace with Supabase `select` on `monthly_financials` where `cycle_id` matches
- Doctor Commission and Net Profit are derived values — computed client-side from the above queries
- No RLS restrictions needed for dashboard reads — admin role already enforced by layout guard
- `refreshData()` re-fetches all data — replace with Supabase query refetch

**Connection:** Depends on Task 4 (layout) and Tasks 5–6 (data exists). Reads from same data Assistant entered.

**Next Step →** Task 8

---

## Task 8 — Admin Portal: Case & Lab Fee Reconciliation + Case Type Selector (Completed 9/4/2026)

**Title:** Build the lab reconciliation table with lab assignment, lab fee input, and structured Case Type + Tooth Number selector for Case records

**Expected Outcome:** A reconciliation table listing all active Case-type records with patient info pulled directly from the PatientRecord table (name, date, diagnosis), inline lab fee input, and lab assignment toggle buttons. Case records use a structured Case Type dropdown + Tooth Number checkbox grid instead of free-text Diagnosis.

**Things To Do:**

### Lab Reconciliation Table
- ✅ Create `app/admin/reconciliation/page.tsx` with `PortalLayout` and `LabReconciliationTable`
- ✅ Build `components/reconciliation/LabReconciliationTable.tsx` using shadcn `Table`, `Input`, `Badge`, `Button`, `Skeleton`
- ✅ **Restructure columns to: Patient Name, Date, Diagnosis, Lab (toggle buttons), Lab Fee (inline input)**
  - Patient Name → `record.patient_name`
  - Date → `record.entry_date` (formatted)
  - Diagnosis → `record.diagnosis`
  - Lab → `LabSelector` toggle buttons (unchanged)
  - Lab Fee → `LabFeeInput` inline input (unchanged)
- ✅ Remove old columns: Total Cost, Paid, Balance, Status
- ✅ Remove `TableFooter` total lab fees aggregation row
- ✅ Remove `formatCurrency` helper (no longer needed)
- ✅ Update loading skeleton to match new 5-column layout
- ✅ Validation: reject negative values, non-numeric input
- ✅ Loading state: shadcn `Skeleton` rows
- ✅ Error state: shadcn `Alert` with Retry button
- ✅ Empty state: "No cases to reconcile" with dashed border

### Lab Assignment Toggle
- ✅ Added `labs: Lab[]` to DataContext interface, exposed `MOCK_LABS` via provider
- ✅ Built `LabSelector` component — button group (outline/default variant) in "Lab" column
- ✅ Each row shows currently assigned lab; clicking a different button updates `lab_id` and `lab_name`
- ✅ No lab selected → all buttons outline (neutral state)
- ✅ Disabled when cycle is locked
- ✅ Lab reassignment after fee set — keeps fee, reassigns lab

### Case Type + Tooth Number Selector (replaces free-text Diagnosis for Case records)
- ✅ Added `CaseType` interface to `lib/global.ts`: `{ id: string; name: string }`
- ✅ Added `case_type?: string` and `teeth?: string` (comma-separated) to `PatientRecord`
- ✅ Added `MOCK_CASE_TYPES` to `lib/mock-data.ts`: RPD, Crown, Bridge
- ✅ Exposed `caseTypes` from DataContext
- ✅ Created `components/records/CaseTypeSelector.tsx` — shadcn `Select` dropdown
- ✅ Created `components/records/ToothNumberGrid.tsx` — 4-row checkbox grid (11-18, 21-28, 31-38, 41-48)
- ✅ Updated `CaseFormFields.tsx` — replaced free-text Diagnosis with CaseTypeSelector + ToothNumberGrid + auto-generated diagnosis display
- ✅ Updated `PatientRecordUpdateForm.tsx` — added `caseType`/`teeth` to form state, auto-generates `diagnosis = "RPD at 41,42,43,44"` on save
- ✅ GP records still use free-text Diagnosis (no regression)
- ✅ Validation: case type required, at least 1 tooth required
- ✅ Edit mode pre-selects stored case type and teeth

### Misc
- ✅ Fixed sidebar nav links to use `/admin/reconciliation` instead of `/admin-reconciliation`

**Backend Plan Remarks:**
- Mock `updateRecord()` patches `lab_fee`, `lab_payment_status`, `lab_id`, `lab_name`, `case_type`, `teeth` on record — replace with Supabase `update` on `patient_records`
- `MOCK_LABS` exposed via DataContext — replace with Supabase `select` on `labs` table
- `MOCK_CASE_TYPES` exposed via DataContext — replace with Supabase `select` on `case_types` table
- `case_type` and `teeth` stored on `patient_records` — add columns `case_type text`, `teeth text` (comma-separated or `text[]` array)
- `diagnosis` auto-generated client-side from `case_type + " at " + teeth` — consider storing both raw and computed values
- Supabase RLS: admin can update `lab_fee`/`lab_payment_status`/`lab_id`/`lab_name`; assistant can read but not reassign
- Admin CRUD for case types (add/edit/delete) — future task, store in `case_types` table with RLS
- Table now reads `entry_date` and `diagnosis` directly from `patient_records` — no joins needed

**Connection:** Depends on Task 4 (layout). Feeds into Task 7 (Dashboard recalculates commission). Read-only when cycle locked.

**Next Step →** Task 9

---

## Task 9 — Admin Portal: Monthly Overhead & Expenses (Completed 9/4/2026)

**Title:** Build the overhead input form for monthly operating expenses

**Expected Outcome:** A single form where the admin enters General Expense, Assistant Salary, Bonus, Rent, and Utilities. Saving updates the dashboard totals immediately.

**Things To Do:**
- ✅ Create `app/admin/overhead/page.tsx`
- ✅ Build `components/overhead/OverheadForm.tsx` using shadcn `Card`, `Input`, `Label`, `Button`, `Alert`
- ✅ Fields: General Expense, Assistant Salary, Bonus, Building Rent, Utility Costs (all `Input`)
- ✅ Load existing values from mock data context for the active cycle (pre-fill if already saved)
- ✅ Save via mock state update — patch `monthly_financials` in context (no Supabase upsert)
- ✅ Validation: reject negative values with inline shadcn `Alert` error
- ✅ Loading state: shadcn `Skeleton` spinner on save `Button`
- ✅ Error state: shadcn `Alert` error banner, form values preserved
- ✅ Edge case: all fields zero, re-editing after dashboard already calculated → confirm recalculation
- ✅ Empty state: all fields blank (0), not last month's values
- ✅ After save → Admin Dashboard (Task 7) shows updated overhead and net profit

**Backend Plan Remarks:**
- Mock `updateFinancials()` patches `monthly_financials` in context — replace with Supabase `upsert` on `monthly_financials` where `cycle_id` matches
- `financials` state is now `useState<MonthlyFinancials[]>` in DataContext — swap with Supabase query on mount
- Form pre-fills from context on initial render — replace with Supabase select on page load
- No RLS restrictions needed for overhead writes — admin role enforced by layout guard

**Connection:** Depends on Task 4 (layout). Provides expense data for Task 7 (Dashboard).

**Next Step →** Task 10

---

## Task 10 — Admin Portal: Month-End Closeout (Completed 9/4/2026)

**Title:** Build the 2-step closeout workflow with record partitioning

**Expected Outcome:** A two-step confirmation flow that previews what will be purged vs. carried forward, then executes state transition on settled records and migrates unsettled cases to the new cycle.

**Things To Do:**
- ✅ Create `app/admin/closeout/page.tsx`
- ✅ Build `components/closeout/CloseoutWizard.tsx` using shadcn `Card`, `Button`, `Alert`, `Badge`, `Progress`, `Separator`
- ✅ Step 1 — Preview:
  - ✅ Read all records in active cycle from mock context
  - ✅ Partition: settled (GP + Case with balance=0) vs. unsettled (Case with balance>0)
  - ✅ Display summary using shadcn `Card`: "X records will be purged, Y cases will carry forward"
  - ✅ List unsettled cases with their remaining balances using shadcn `Badge`
- ✅ Step 2 — Confirm:
  - ✅ Final warning with destructive styling (red shadcn `Button`)
  - ✅ Block double-submit (disable after first click)
- ✅ Execution logic (mock state transition — no Supabase calls):
  - ✅ Remove settled records from context state
  - ✅ Set `is_carried_forward = true` on unsettled cases in context
  - ✅ Create new cycle object in context with status OPEN
  - ✅ Link unsettled cases to new cycle
  - ✅ Set old cycle status to CLOSED in context
- ✅ Loading state: shadcn `Progress` blocking indicator during execution (not interruptible)
- ✅ Error state: shadcn `Alert` clear failure message, no broken state
- ✅ Edge case: no records to close (all zeros), very large cycle with progress indicator
- ✅ Empty state: closeout still allowed, summary shows zeros

**Backend Plan Remarks:**
- `closeoutCycle()` mutates context state — replace with Supabase transaction: delete settled `patient_records` + `case_payments`, update unsettled records with new `cycle_id` + `is_carried_forward = true`, close old `monthly_cycles` row, insert new `monthly_cycles` row
- `allCycles` is now `useState<MonthlyCycle[]>` — swap with Supabase query on mount
- New cycle `month_year` is computed as current month + 1 — consider server-side for timezone safety
- Closed cycle financials remain linked to old `cycle_id` — no re-linking needed
- RLS: only admin can trigger closeout — enforce server-side, not just layout guard

**Connection:** Depends on Tasks 5–9 (all data exists). Final task in the workflow — resets cycle for new month.

**Next Step →** Done (all screens complete)

---

## Task Dependency Graph

```
Task 1 (Scaffolding)
  └→ Task 2 (Types)
       └→ Task 3 (Auth)
            └→ Task 4 (Layouts)
                 ├→ Task 5 (Record Table)
                 │    └→ Task 6 (Add/Edit Modal)
                 │         └→ Task 6.1 (Payment Installments & History)
                 │              └→ Task 6.2 (Admin Access to Record Table)
                 │                   └→ Task 7 (Dashboard) ← reads data from 5,6,6.1
                 ├→ Task 8 (Lab Reconciliation + Case Type Selector) ─→ Task 7
                 ├→ Task 9 (Overhead) ─→ Task 7
                 └→ Task 10 (Closeout) ← depends on 5-9
```

---

## Task Summary

| # | Task | Screen | Role | Status |
|---|------|--------|------|--------|
| 1 | Project Scaffolding | — | — | ✅ |
| 2 | TypeScript Types | — | — | ✅ |
| 3 | Auth & Login | `/login` | Both | ✅ |
| 4 | Layout Shells | Sidebar/Layout | Both | ✅ |
| 5 | Record Table | `/assistant` | Assistant | ✅ |
| 6 | Add/Edit Modal | `/assistant` (modal) | Assistant | ✅ |
| 6.1 | Payment Installments & History | `/assistant` (modal + table) | Assistant | ✅ |
| 6.2 | Admin Access to Record Table | `/admin/records` | Admin | ✅ |
| 7 | Financial Dashboard | `/admin` | Admin | ✅ |
| 8 | Case & Lab Fee Reconciliation + Case Type Selector | `/admin/reconciliation` | Admin | ✅ |
| 9 | Overhead & Expenses | `/admin/overhead` | Admin | ✅ |
| 10 | Month-End Closeout | `/admin/closeout` | Admin | ✅ |

---

## Mock Data Strategy

All tasks use mock data stored in a React context (`lib/mock-data.ts` or `context/DataContext.tsx`). This makes it trivial to swap in real Supabase calls later.

**Mock data file should include:**
- Sample users (`admin`, `assistant`) with roles
- One open cycle with sample patient records (mix of GP and Case)
- Sample case payments
- Sample monthly financials (overhead values)
- Helper functions: `getActiveCycle()`, `getRecordsByCycle()`, `getFinancialsByCycle()`

**When Supabase is ready (see `backend-draft-plan.md`):**
- Replace context reads with Supabase queries
- Replace context writes with Supabase insert/update/delete
- Replace mock auth with `signInWithPassword`
- Add `@supabase/ssr` middleware for session management
