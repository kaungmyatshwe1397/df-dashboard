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

GP and Case lists omit clinic patient IDs in desktop tables and mobile cards.
GP row numbers continue across pages in the currently sorted/filtered list; mobile
cards show the same record number. Case lists omit lab details and expose an All
labs / Not assigned / named lab selector inside the existing Filters sheet, before
sorting and pagination. The Filters badge includes the selected lab on the Case tab;
Clear filters resets the lab too. Lab details remain available in Edit. Both tables
use proportional columns without a forced minimum width. Main rows stay on one
line, with truncated long text and full values on hover. Case actions live in a
labeled Actions menu rather than wrapping across lines. Expanded Case payment
history spans all nine remaining columns.

Deferred verification TODO (next commit): verify numbering after sorting/pagination,
no patient-ID or lab display on the lists, and single-line rows without horizontal scrolling.
Component test TODOs for the next commit: verify named-lab and unassigned filters,
combining lab with patient search, resetting/clamping pagination, empty results,
and retaining lab details in Edit while hiding them from desktop/mobile lists.
Also verify lab options appear only in the Case Filters sheet, the badge and Clear
filters include lab selection, and the row Actions menu preserves payment/edit flows.

| State | Checklist |
|---|---|
| Ideal | - Table lists all current-month records with Patient, Category, Cost, Balance<br>- Carried-forward records are visually flagged (e.g. badge "Carried forward") |
| Empty | - No records yet this cycle → friendly message ("No entries yet today") + "Add record" button visible |
| Loading | - Skeleton rows shown while table data loads |
| Error | - Failed to load → retry button + short error message |
| Edge case | - Very long patient names truncate with ellipsis, full name on hover<br>- Case with Balance = 0 shows "Payment Complete" label (per PRD 3.1)<br>- Large number of rows (100+) → pagination or scroll, no layout break |

---

## 3. Add / Edit Patient Record

**Case entry update (2026-11-07):** Add opens one page directly with patient/contact,
treatment, and payment cards. No clinic-ID, registration-status, or duplicate-match
gate appears. Payment starts at zero; remaining balance updates live. Lab name,
send date, and delivery date are optional in a collapsed shadcn panel. Saved lab
details open for editing. Staff can add or clear lab details later. Standalone Case
edits preserve receipt totals and use Record payment for further installments.
Saving/reset/retry behavior matches GP; Save & back returns to the Case tab.
Empty/invalid required fields and overpayment show inline errors. An uncertain
response locks the draft for retry with the same request and submission UUID.

**GP entry update (2026-11-07):** GP opens directly with name, age, gender, optional
address, date, treatment, and cost. It has no patient-ID/search gate, clinical-history
fields, registration status, or registry writes. Validate blank/invalid fields inline.
Save & add another clears all visit/patient values except date and creates a new
submission identity. Saving disables fields and repeat submission. An uncertain
response retains and locks the draft for Retry save with the original submission.
Confirmed validation or missing-migration errors allow correcting the draft.
Search and Edit visit must include standalone GP records and persist their own
demographics without loading a registry profile. Existing linked visits remain intact.
The clinic-ID workflow described below applies to Case entry.

Optional telephone is stored per visit and can be added, edited, or cleared. GP edit
uses the same record-only fields for both new standalone and older linked visits.
Hidden clinical history must not be cleared. Patient and visit cards sit side by side
on wider screens and stack on mobile. Delete, Cancel, and Save Changes remain
available in the edit footer, with disabled actions while saving or deleting.

GP and Case add use full pages. The clinic-ID dialog requires an explicit match confirmation, validates a new ID against the current year, or starts an unregistered profile. Patient entry offers Male and Female. Save returns to the matching Records tab; Save & add another saves one visit and resets patient details while retaining the visit date. Failed saves retain the form and submission identity for safe retry. Case entry includes case type, teeth, lab, dates, and initial payment. Record edits keep their dialog flow.

| State | Checklist |
|---|---|
| Ideal | Add opens the full-page record form. Check and confirm a clinic ID, create a registered patient with a new ID, or choose an unregistered patient. New profiles require name, age, and Male or Female. Save creates the optional profile, cycle, visit, and initial CASE receipt atomically. Edit selects the actual visit by UUID within the selected month/category. |
| Empty | No matches offers fewer filters and New unregistered patient. New profiles omit clinic ID; unknown IDs never force registration first. |
| Loading | Debounced search ignores stale responses. Saving disables fields, close, and repeat submit. Profile loading prevents edit submission. |
| Error | Lookup failure has Retry. Uncertain save failure retains all fields and submission UUID. A confirmed clinic-ID uniqueness rejection unlocks patient selection and retains the treatment draft. A committed request with changed values is rejected with original-value retry guidance. No partial profiles, cycles, visits, or receipts remain after rollback. |
| Edge case | Same-name patients show age, gender, address, ID, and status before selection. Global search can find an existing patient without an ID. Matching new demographics require explicit separate-person confirmation; choosing an existing unregistered match retains a checked new ID. Changing patient preserves treatment draft. Optional ID displays Not assigned. Past record dates are accepted; invalid/future dates are rejected. Existing CASE paid values are read-only; installments use Record payment. Cost cannot be below receipts. |

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
| Ideal | Registered and Unregistered tabs have separate status membership, server pagination, counts, and demographic search. Directory rows/cards show number, patient ID, name, age, address, and View patient. Gender and registration date appear in the profile. The profile exposes edit and register/unregister actions for editable roles. Sorting by clinic ID, name, or registration date/date added applies before pagination. Register promotes the same UUID; Unregister preserves clinic ID and history. |
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
