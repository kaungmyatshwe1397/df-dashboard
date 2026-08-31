# DC-FMS Frontend Build Plan

> **Tech Stack:** Next.js App Router · Tailwind CSS · Supabase · Lucide React Icons · shadcn/ui
> **Reference:** `tokens.md` · `dc-fms-user-flow.mermaid` · `dc-fms-erd.mmd` · `dc-fms-ui-states-checklist.md` · `prd.md`

---

## Task 1 — Project Scaffolding

**Title:** Initialize Next.js project with Tailwind CSS and Supabase

**Expected Outcome:** A running Next.js dev server with Tailwind configured, Supabase client ready, and the `tokens.css` file imported in the global stylesheet.

**Things To Do:**
- `npx create-next-app@latest` with App Router, TypeScript, Tailwind CSS
- Install `@supabase/supabase-js` and `@supabase/ssr`
- Run `npx shadcn@latest init` to set up shadcn/ui
- Install shadcn components: `npx shadcn@latest add button input label card dialog table badge alert select textarea skeleton sidebar separator pagination progress radio-group`
- Create `lib/supabase/client.ts` (browser client) and `lib/supabase/server.ts` (server client)
- Move `tokens.css` into `app/globals.css` or import it — all CSS variables available in `:root`
- Add Inter font via `next/font/google`
- Verify dev server runs, Tailwind classes work, and CSS tokens are accessible

**Connection:** Foundation for all subsequent tasks. No prior work.

**Next Step →** Task 2

---

## Task 2 — TypeScript Types from ERD

**Title:** Generate TypeScript interfaces for all Supabase tables

**Expected Outcome:** A `types/database.ts` file with typed interfaces for `User`, `MonthlyCycle`, `PatientRecord`, `CasePayment`, `Lab`, `MonthlyFinancials` — matching the ERD exactly.

**Things To Do:**
- Read `dc-fms-erd.mmd` and translate each table into a TypeScript interface
- Define enums: `UserRole` (ADMIN/ASSISTANT), `CycleStatus` (OPEN/CLOSED), `RecordCategory` (GP/CASE), `LabPaymentStatus` (PAID/UNPAID), `PaymentStatus` (PAID/UNPAID)
- Define relationship types (e.g. `PatientRecord` has `CasePayment[]`)
- Create a `Database` type for Supabase generic typing

**Connection:** Depends on Task 1 (project exists). Types are used by every screen in Tasks 5–8.

**Next Step →** Task 3

---

## Task 3 — Auth & Login Page

**Title:** Build login page with Supabase authentication and role-based redirect

**Expected Outcome:** A functional login page that authenticates via Supabase, reads the user's role, and redirects to `/assistant` or `/admin`. Handles all 5 UI states from the checklist.

**Things To Do:**
- Create `app/page.tsx` as redirect to `/login`
- Build `app/login/page.tsx` with username + password form using shadcn `Card`, `Input`, `Label`, `Button`, `Alert`
- Implement Supabase `signInWithPassword` in a Server Action
- On success, read `role` from `users` table → redirect `/admin` or `/assistant`
- On failure, show inline error using shadcn `Alert` (never reveal which field was wrong)
- Implement all 5 states: ideal, empty (blank form), loading (shadcn `Skeleton`), error (inline `Alert`), edge case (long input, caps lock)
- Create `middleware.ts` to protect routes by role
- Store session in cookies via `@supabase/ssr`

**Connection:** First user-facing screen. Foundation for all portal access.

**Next Step →** Task 4

---

## Task 4 — Layout Shells (Assistant + Admin)

**Title:** Create role-specific layout components with sidebar/header navigation

**Expected Outcome:** Two layout wrappers — `AssistantLayout` and `AdminLayout` — each with a sidebar showing only the navigation items that role can access (per PRD Section 2).

**Things To Do:**
- Create `components/layout/Sidebar.tsx` with navigation links using shadcn `Sidebar`, `Button`, `Badge`, `Separator`
- Create `app/assistant/layout.tsx` — sidebar links: "Record Table", "Add Entry" (hide financial links)
- Create `app/admin/layout.tsx` — sidebar links: "Dashboard", "Lab Reconciliation", "Overhead", "Closeout"
- Add user info display (username, shadcn `Badge` for role) and logout `Button` in sidebar footer
- Use Lucide icons for nav items
- Style using Tailwind + tokens (spacing, colors, typography)
- Handle locked cycle state — visually indicate when cycle is locked in the layout

**Connection:** Depends on Task 3 (auth/role). Provides shell for Tasks 5–8.

**Next Step →** Task 5

---

## Task 5 — Assistant Portal: Active Cycle Record Table

**Title:** Build the main data entry table showing current cycle patient records

**Expected Outcome:** A table listing all patient records for the active cycle, with carried-forward records visually flagged. Handles all 5 UI states. Read-only when cycle is locked.

**Things To Do:**
- Create `app/assistant/page.tsx` as the default assistant view
- Query `patient_records` joined with `case_payments` for active `cycle_id`
- Build `components/RecordTable.tsx` using shadcn `Table`, `Badge`, `Button`, `Card`, `Pagination`
- Columns: Date, Patient Name, Category (GP/Case), Total Cost, Paid, Balance, Status
- Flag carried-forward records with a shadcn `Badge` (`is_carried_forward = true`)
- Show "Payment Complete" shadcn `Badge` when `balance = 0` for Case records
- Implement shadcn `Skeleton` loading state
- Implement empty state: "No entries yet this cycle" + shadcn `Button` Add
- Implement error state: shadcn `Button` retry
- Implement edge case: long names truncate with ellipsis, large row count with `Pagination`
- When cycle is locked → hide edit icons, show read-only indicator
- Add "Add Record" shadcn `Button` that opens the modal (Task 6)

**Connection:** Depends on Task 4 (layout). Data source for Admin Dashboard (Task 7).

**Next Step →** Task 6

---

## Task 6 — Assistant Portal: Add/Edit Patient Record Modal

**Title:** Build the modal form for creating and editing patient records

**Expected Outcome:** A modal form that lets the assistant create new records and edit existing ones (when cycle is open). Validates all fields and handles all 5 UI states.

**Things To Do:**
- Create `components/PatientRecordModal.tsx` using shadcn `Dialog`, `Input`, `Label`, `Button`, `RadioGroup`, `Alert`
- Fields: Patient Name (required), Address (optional), Category (GP/Case `RadioGroup`), Diagnosis (required), Total Cost (required, decimal), Amount Paid Today (required, decimal)
- For Case category: show "Amount Paid Today" `Input` — system calculates remaining balance
- For GP category: Amount Paid Today should equal Total Cost (validate or auto-fill)
- Validation: Amount Paid Today <= Total Cost, required fields not empty, numeric values valid
- Save via Supabase insert (new) or update (edit)
- Loading state: shadcn `Skeleton` spinner on save `Button`, dialog not closable mid-save
- Error state: inline field errors, network error shadcn `Alert` inside dialog (preserve form data)
- Edge case: Amount Paid = 0 (deposit), decimal costs (1500.50), long diagnosis text wraps
- When cycle is locked → dialog does not open, edit is blocked
- After save → close dialog, refresh table (Task 5)

**Connection:** Depends on Task 5 (table). Creates data that Task 7 (Admin Dashboard) reads.

**Next Step →** Task 7

---

## Task 7 — Admin Portal: Live Financial Dashboard

**Title:** Build the admin dashboard with real-time KPI cards

**Expected Outcome:** A dashboard showing all financial KPIs — Total GP Revenue, Total Case Revenue, Lab Deductions, Doctor Commission (40%), Operating Overhead, Net Profit/Loss — with correct formatting and color coding.

**Things To Do:**
- Create `app/admin/page.tsx` as the default admin view
- Query `patient_records`, `case_payments`, `monthly_financials` for the active cycle
- Build `components/KpiCard.tsx` using shadcn `Card`, `Badge`, `Separator` — reusable card with label, value, optional icon
- Calculate per PRD formulas:
  - `Total GP Revenue` = sum of GP records total_cost
  - `Total Case Revenue` = sum of Case records paid amounts (cash flow)
  - `Total Lab Fees` = sum of lab_fee from patient_records
  - `Doctor Commission` = (Gross Income - Lab Fees) * 0.40
  - `Operating Overhead` = general_expenses + assistant_fee + bonus + building_rent + utility_costs
  - `Net Profit/Loss` = Remaining Clinic Income - Operating Expenses
- Color code using shadcn `Badge`: Net Profit = green, Net Loss = red, Zero = neutral
- Format currency with thousands separators, 2 decimal places
- Loading state: shadcn `Skeleton` KPI cards
- Error state: per-card error with shadcn `Button` retry
- Edge case: zero values show "0.00", large numbers don't break card width

**Connection:** Depends on Task 4 (layout) and Tasks 5–6 (data exists). Reads from same data Assistant entered.

**Next Step →** Task 8

---

## Task 8 — Admin Portal: Case & Lab Fee Reconciliation

**Title:** Build the lab fee assignment table for active Case treatments

**Expected Outcome:** A table listing all active Case-type records with an inline input field for lab fee per case. Total lab fees auto-aggregate as fees are entered.

**Things To Do:**
- Create `app/admin/reconciliation/page.tsx`
- Query `patient_records` where `category = 'CASE'` and `balance > 0`
- Build `components/LabReconciliationTable.tsx` using shadcn `Table`, `Input`, `Badge`, `Button`, `Skeleton`
- Columns: Patient, Total Cost, Paid, Balance, Lab Fee (inline `Input`), Lab Status (`Badge`)
- Inline editable lab fee `Input` — saves on blur or Enter key
- Auto-aggregate total lab fees at the bottom of the table
- Update `lab_fee` and `lab_payment_status` on the `patient_records` row
- Validation: reject negative values, non-numeric input
- Loading state: shadcn `Skeleton` row-level spinner while saving
- Error state: inline error on the row, value preserved
- Edge case: lab fee = 0 allowed, lab fee > total cost shows warning `Badge`
- Empty state: "No active cases to reconcile"
- After lab fee changes → Admin Dashboard (Task 7) recalculates

**Connection:** Depends on Task 4 (layout). Feeds into Task 7 (Dashboard recalculates commission).

**Next Step →** Task 9

---

## Task 9 — Admin Portal: Monthly Overhead & Expenses

**Title:** Build the overhead input form for monthly operating expenses

**Expected Outcome:** A single form where the admin enters General Expense, Assistant Salary, Bonus, Rent, and Utilities. Saving updates the dashboard totals immediately.

**Things To Do:**
- Create `app/admin/overhead/page.tsx`
- Build `components/OverheadForm.tsx` using shadcn `Card`, `Input`, `Label`, `Button`, `Alert`
- Fields: General Expense, Assistant Salary, Bonus, Building Rent, Utility Costs (all `Input`)
- Load existing values from `monthly_financials` for the active cycle (pre-fill if already saved)
- Save via Supabase upsert on `monthly_financials`
- Validation: reject negative values with inline shadcn `Alert` error
- Loading state: shadcn `Skeleton` spinner on save `Button`
- Error state: shadcn `Alert` error banner, form values preserved
- Edge case: all fields zero, re-editing after dashboard already calculated → confirm recalculation
- Empty state: all fields blank (0), not last month's values
- After save → Admin Dashboard (Task 7) shows updated overhead and net profit

**Connection:** Depends on Task 4 (layout). Provides expense data for Task 7 (Dashboard).

**Next Step →** Task 10

---

## Task 10 — Admin Portal: Month-End Closeout

**Title:** Build the 2-step closeout workflow with record partitioning

**Expected Outcome:** A two-step confirmation flow that previews what will be purged vs. carried forward, then executes hard delete on settled records and migrates unsettled cases to the new cycle.

**Things To Do:**
- Create `app/admin/closeout/page.tsx`
- Build `components/CloseoutWizard.tsx` using shadcn `Card`, `Button`, `Alert`, `Badge`, `Progress`, `Separator`
- Step 1 — Preview:
  - Query all records in active cycle
  - Partition: settled (GP + Case with balance=0) vs. unsettled (Case with balance>0)
  - Display summary using shadcn `Card`: "X records will be purged, Y cases will carry forward"
  - List unsettled cases with their remaining balances using shadcn `Badge`
- Step 2 — Confirm:
  - Final warning with destructive styling (red shadcn `Button`)
  - Block double-submit (disable after first click)
- Execution logic (Server Action):
  - Hard delete settled records from `patient_records` and `case_payments`
  - Update `is_carried_forward = true` on unsettled cases
  - Create new `monthly_cycles` row with status OPEN
  - Link unsettled cases to new cycle
  - Update `monthly_cycles` old row to CLOSED
- Loading state: shadcn `Progress` blocking indicator during execution (not interruptible)
- Error state: shadcn `Alert` clear failure message, no broken state
- Edge case: no records to close (all zeros), very large cycle with progress indicator
- Empty state: closeout still allowed, summary shows zeros

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
                 │         └→ Task 7 (Dashboard) ← reads data from 5,6
                 ├→ Task 8 (Lab Reconciliation) ─→ Task 7
                 ├→ Task 9 (Overhead) ─→ Task 7
                 └→ Task 10 (Closeout) ← depends on 5-9
```

---

## Task Summary

| # | Task | Screen | Role |
|---|------|--------|------|
| 1 | Project Scaffolding | — | — |
| 2 | TypeScript Types | — | — |
| 3 | Auth & Login | `/login` | Both |
| 4 | Layout Shells | Sidebar/Layout | Both |
| 5 | Record Table | `/assistant` | Assistant |
| 6 | Add/Edit Modal | `/assistant` (modal) | Assistant |
| 7 | Financial Dashboard | `/admin` | Admin |
| 8 | Lab Reconciliation | `/admin/reconciliation` | Admin |
| 9 | Overhead & Expenses | `/admin/overhead` | Admin |
| 10 | Month-End Closeout | `/admin/closeout` | Admin |
