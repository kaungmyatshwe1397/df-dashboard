# DC-FMS UI States Checklist

A test-ready checklist of the 5 core UI states for every screen in the app.
Use this to design each screen and to QA it before release.

**The 5 states:**
1. **Ideal** — normal, happy-path data
2. **Empty** — no data yet
3. **Loading** — data is being fetched or an action is processing
4. **Error** — something failed
5. **Edge case** — unusual but valid data (long text, zero values, limits)

---

## 1. Login

| State | Checklist |
|---|---|
| Ideal | - Username + password fields visible<br>- "Log in" button enabled once both fields are filled |
| Empty | - Fields empty on first load<br>- Button disabled or shows inline validation on submit attempt |
| Loading | - Button shows a spinner and disables itself while checking credentials<br>- Fields lock during check |
| Error | - Wrong username/password shows a clear inline message (not a raw server error)<br>- Message does not reveal whether it was the username or password that was wrong (security) |
| Edge case | - Caps Lock warning (optional)<br>- Very long username/password does not break the layout<br>- Repeated failed attempts — decide if lockout is needed |

---

## 2. Assistant Portal — Active Cycle Record Table

| State | Checklist |
|---|---|
| Ideal | - Table lists all current-month records with Patient, Category, Cost, Balance<br>- Carried-forward records are visually flagged (e.g. badge "Carried forward") |
| Empty | - No records yet this cycle → friendly message ("No entries yet today") + "Add record" button visible |
| Loading | - Skeleton rows shown while table data loads |
| Error | - Failed to load → retry button + short error message |
| Edge case | - Very long patient names truncate with ellipsis, full name on hover<br>- Case with Balance = 0 shows "Payment Complete" label (per PRD 3.1)<br>- Cycle is locked → table becomes read-only, edit icons hidden or disabled<br>- Large number of rows (100+) → pagination or scroll, no layout break |

---

## 3. Add / Edit Patient Record (Modal)

| State | Checklist |
|---|---|
| Ideal | - All fields present: Patient Name, Address (optional), Category (GP/Case), Diagnosis, Total Cost, Amount Paid Today<br>- Save button enabled once required fields are valid |
| Empty | - Fresh "Add" form opens fully blank<br>- Address field clearly marked optional |
| Loading | - Save button shows spinner and disables during submit<br>- Modal cannot be closed mid-save |
| Error | - Required field missing → inline error under that field, not a generic alert<br>- Amount Paid Today > Total Cost → validation error<br>- Network/save failure → error banner inside modal, form data preserved (not lost) |
| Edge case | - Amount Paid Today = 0 (deposit not yet made)<br>- Total Cost with decimals (e.g. 1500.50)<br>- Editing a record after cycle is locked → should be blocked with explanation<br>- Very long diagnosis text wraps properly, does not overflow modal |

---

## 4. Admin Portal — Live Financial Dashboard

| State | Checklist |
|---|---|
| Ideal | - KPI cards show Total GP Revenue, Total Case Revenue, Lab Deductions, Doctor Commission (40%), Overhead, Net Profit/Loss<br>- Net Profit/Loss visually distinct when positive vs negative (e.g. color) |
| Empty | - New cycle just opened, zero transactions → all KPIs show 0, not blank or "undefined" |
| Loading | - Skeleton placeholders for each KPI card while totals are calculated |
| Error | - Calculation/fetch failure → error state per card or full-dashboard banner, with retry |
| Edge case | - Net Profit/Loss = exactly 0 → neutral styling, not red or green<br>- Negative Net Profit → clearly marked as a loss (per PRD 3.3)<br>- Very large numbers (e.g. 1,000,000+) format with thousands separators and don't break card width |

---

## 5. Admin Portal — Case & Lab Fee Reconciliation

| State | Checklist |
|---|---|
| Ideal | - Table of active Case treatments with input field for lab fee per case<br>- Total lab fees auto-updates as fees are entered (per PRD 4.2) |
| Empty | - No active Case-type treatments this cycle → message ("No cases to reconcile") |
| Loading | - Row-level spinner or disabled input while a lab fee save is in progress |
| Error | - Invalid lab fee input (negative number, non-numeric) → inline validation<br>- Save failure → error indicator on that row, value not silently lost |
| Edge case | - Lab fee = 0 (no lab cost for this case)<br>- Lab fee greater than case's Total Cost → warn, since this affects commission math<br>- Case already has a fee assigned, being edited again |

---

## 6. Admin Portal — Monthly Overhead & Expenses

| State | Checklist |
|---|---|
| Ideal | - Single form: General Expense, Assistant Salary, Bonus, Rent, Utilities<br>- Save updates dashboard totals immediately |
| Empty | - First time this cycle → all fields blank or 0, not pre-filled with last month's numbers unless explicitly designed to carry over |
| Loading | - Save button spinner while submitting |
| Error | - Negative values rejected with inline message<br>- Save failure → error banner, entered values preserved |
| Edge case | - All fields left at 0 (e.g. no bonus this month)<br>- Re-editing overhead after dashboard already calculated Net Profit → confirm recalculation happens |

---

## 7. Admin Portal — Month-End Closeout (2-step confirmation)

| State | Checklist |
|---|---|
| Ideal | - Step 1: summary preview (what will be purged vs. carried forward)<br>- Step 2: final confirm, action button clearly marked as destructive (e.g. red) |
| Empty | - Nothing to close (no records this cycle) → closeout still allowed, summary shows all zeros |
| Loading | - During purge/carry-forward execution, show a blocking progress state — this action must not be interruptible mid-way |
| Error | - Purge fails partway → must NOT leave data in a broken in-between state; show clear failure message and safe rollback or retry guidance |
| Edge case | - Cases with Balance > 0 correctly listed as "will carry forward," never accidentally deleted<br>- Admin tries to double-submit closeout (double-click) → second click blocked<br>- Very large cycle (many records) → progress indicator, not a frozen screen |

---

## Cross-cutting checklist (applies to all screens)

- [ ] Role permissions respected in every state (Assistant never sees financial totals or lab fees, per PRD Section 2)
- [ ] All currency values use consistent formatting and decimal places
- [ ] All error messages are human-readable, never raw system/server errors
- [ ] Loading states never block the whole app — only the relevant section
- [ ] Forms preserve user input if a save fails (no silent data loss)
- [ ] Locked/closed cycle state is visually obvious wherever it applies
- [ ] Mobile/responsive check not required (PRD specifies Desktop/PC optimized, per Section 5.1)
