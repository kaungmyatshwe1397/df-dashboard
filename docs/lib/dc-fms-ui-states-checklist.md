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
| Ideal | - Email + password fields visible<br>- "Log in" button enabled once both fields are filled |
| Empty | - Fields empty on first load<br>- Button disabled or shows inline validation on submit attempt |
| Loading | - Button shows a spinner and disables itself while checking credentials<br>- Fields lock during check |
| Error | - Wrong email/password shows a clear inline message (not a raw server error)<br>- Message does not reveal whether it was the email or password that was wrong (security) |
| Edge case | - Caps Lock warning (optional)<br>- Very long username/password does not break the layout<br>- Repeated failed attempts — decide if lockout is needed |

---

## 2. Assistant Portal — Active Cycle Record Table

| State | Checklist |
|---|---|
| Ideal | - Table lists all current-month records with Patient, Category, Cost, Balance<br>- Carried-forward records are visually flagged (e.g. badge "Carried forward") |
| Empty | - No records yet this cycle → friendly message ("No entries yet today") + "Add record" button visible |
| Loading | - Skeleton rows shown while table data loads |
| Error | - Failed to load → retry button + short error message |
| Edge case | - Very long patient names truncate with ellipsis, full name on hover<br>- Case with Balance = 0 shows "Payment Complete" label (per PRD 3.1)<br>- Large number of rows (100+) → pagination or scroll, no layout break |

---

## 3. Add / Edit Patient Record

| State | Checklist |
|---|---|
| Ideal | Add opens global patient search with name/ID, address, exact age, gender, and registration filters. Select a profile or create an unregistered patient requiring name, age, and gender. Save creates the optional profile, cycle, visit, and initial CASE receipt atomically. Edit selects the actual visit by UUID within the selected month/category. |
| Empty | No matches offers fewer filters and New unregistered patient. New profiles omit clinic ID; unknown IDs never force registration first. |
| Loading | Debounced search ignores stale responses. Saving disables fields, close, and repeat submit. Profile loading prevents edit submission. |
| Error | Lookup failure has Retry. Save failure retains all fields and submission UUID. A committed request with changed values is rejected with original-value retry guidance. No partial profiles, cycles, visits, or receipts remain after rollback. |
| Edge case | Same-name patients show age, gender, address, ID, and status before selection. Matching new demographics require explicit separate-person confirmation. Changing patient preserves treatment draft. Optional ID displays Not assigned. Past record dates are accepted; invalid/future dates are rejected. Existing CASE paid values are read-only; installments use Record payment. Cost cannot be below receipts. |

Successful adds select the record-date month. Changed edit dates move cycle; unchanged dates preserve carry-forward assignments. Lab milestone and payment dates stay independent. Deleting a visit preserves the profile. Forms and pickers must work on mobile and with keyboard navigation.

---

## 4. Admin Portal — Live Financial Dashboard

| State | Checklist |
|---|---|
| Ideal | - Month selector changes the dashboard cycle and KPI data<br>- KPI cards show Total GP Revenue, Total Case Revenue, Lab Deductions, Doctor Commission (40%), Overhead, Net Profit/Loss in MMK<br>- Net Profit/Loss uses a compact single-column card and is visually distinct when positive vs negative (e.g. color) |
| Empty | - First month / no data yet → all KPIs show 0, not blank or "undefined" |
| Loading | - Skeleton placeholders for each KPI card while totals are calculated |
| Error | - Calculation/fetch failure → error state per card or full-dashboard banner, with retry |
| Edge case | - Net Profit/Loss = exactly 0 → neutral styling, not red or green<br>- Negative Net Profit → clearly marked as a loss (per PRD 3.3)<br>- Very large numbers (e.g. 1,000,000+) format with thousands separators and don't break card width |

---

## 5. Admin Portal — Case & Lab Fee Reconciliation

| State | Checklist |
|---|---|
| Ideal | - Cases appear in responsive cards grouped by lab, with distinct Patient, Patient ID, Case, Date, and inline Lab Fee columns on wide screens<br>- Narrow screens stack the same fields with visible labels<br>- Lab filter and per-lab fee totals are visible<br>- Total lab fees auto-update as fees are saved (per PRD 4.2) |
| Empty | - No active Case-type treatments this cycle → message ("No cases to reconcile") |
| Loading | - Row-level spinner or disabled input while a lab fee save is in progress |
| Error | - Invalid lab fee input (negative number, non-numeric) → inline validation<br>- Save failure → error indicator on that row, value not silently lost |
| Edge case | - Lab fee = 0 (no lab cost for this case)<br>- Long patient names and diagnoses wrap or truncate without breaking column alignment<br>- Narrow screens keep the fee field reachable without a cramped table<br>- Lab fee greater than case's Total Cost → warn, since this affects commission math<br>- Case already has a fee assigned, being edited again |

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

## 7. Admin Portal — Carry Forward

| State | Checklist |
|---|---|
| Ideal | - Single action: counts unsettled CASE balances (N of total) and moves them to the next month<br>- Success message reports how many cases moved |
| Empty | - No unsettled cases → button disabled, count shows 0 |
| Loading | - Button shows spinner and disables during the move — action must not be interruptible mid-way |
| Error | - Carry-forward fails partway → clear failure message; no records left half-moved (retry guidance) |
| Edge case | - Cases with Balance > 0 are the only ones moved — fully paid cases stay in the current month<br>- Double-click the button → second click blocked while loading<br>- Next month's bucket auto-created on first carry-forward |

---

## 8. Patient Registration (Admin + Assistant; Supervisor read-only)

| State | Checklist |
|---|---|
| Ideal | Registered and Unregistered tabs have separate status membership, server pagination, counts, and demographic search. Unregistered rows include name/address from record entry. Register promotes the same UUID; Unregister preserves clinic ID and history. Both mobile cards and desktop rows expose profile/edit/status actions. |
| Empty | No matches keeps filters, tabs, and Add Patient available. Profiles without clinic IDs show Not assigned. |
| Loading | Search has loading feedback and stale-result protection. Add/edit/status actions disable during writes. |
| Error | Fetch errors offer Retry. Registration/duplicate-ID/save errors keep drafts open. UUID profile fetch supports retry and a not-found state; legacy clinic-ID links remain valid. |
| Edge case | Re-registering reuses the reserved ID even across years. New IDs require current-year NNNN/YY and reject 0000. Created date differs from first registration date. Same-demographic new registration prompts selection of an existing profile or separate-person confirmation. Long names/addresses wrap on mobile. |

Test TODOs and commands are tracked in [patient registration](patient-registration.md).

---

## Cross-cutting checklist (applies to all screens)

- [ ] Role permissions respected in every state (Assistant never sees financial totals or lab fees, per PRD Section 2)
- [ ] All currency values use consistent formatting and decimal places
- [ ] All error messages are human-readable, never raw system/server errors
- [ ] Loading states never block the whole app — only the relevant section
- [ ] Forms preserve user input if a save fails (no silent data loss)
- [ ] Mobile/responsive and keyboard entry verified per AGENTS.md.
