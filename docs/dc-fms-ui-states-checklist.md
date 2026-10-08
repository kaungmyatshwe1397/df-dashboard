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

## 3. Add / Edit Patient Record (Modal)

| State | Checklist |
|---|---|
| Ideal | **Add mode:** Dialog opens on Patient ID lookup. A registered ID shows the registry patient name and only the GP or Case record fields; save creates a visit linked to that patient. An unregistered ID shows a clear register-first message and link to Registered Patients; record fields and save action remain unavailable.<br>**Edit mode:** Two-step — enter Patient ID, form appears pre-filled; Patient ID is locked in edit mode.<br>GP fields: Diagnosis, Total Cost.<br>Case fields: Diagnosis, Total Cost, Lab Name, Lab Send Date, Delivery Date, Paid, Remaining (auto).<br>Save button enabled once required fields are valid. |
| Empty | - Add mode opens at a blank Patient ID lookup; no patient or record fields appear until a registry match is found<br>- Edit mode: empty Patient ID field with search button |
| Loading | - Save button shows spinner and disables during submit<br>- Dialog cannot be closed mid-save<br>- Patient ID blur lookup disables the ID field briefly while the registry is queried |
| Error | - Required field missing (Patient ID, Diagnosis, Total Cost) → inline error under that field<br>- Paid > Total Cost → validation error<br>- Failed patient lookup → retry guidance; no record form is shown<br>- Patient becomes unregistered before save → database rejects the visit and the form explains that registration is required<br>- Network/save failure → error banner inside modal, form values are preserved |
| Edge case | - Patient has records in both GP and Case tabs → same registered Patient ID is valid in either tab (registry is global, not per-tab)<br>- Change Patient returns to ID lookup without losing record category<br>- Paid = 0 (deposit not yet made)<br>- Total Cost with decimals (e.g. 1500.50)<br>- Editing demographics on an existing record updates the registry and propagates name/address to that patient's records<br>- Very long diagnosis text wraps properly, does not overflow modal<br>- Delete Record (admin + assistant) removes only the visit record — patient stays in the registry |

---

## 4. Admin Portal — Live Financial Dashboard

| State | Checklist |
|---|---|
| Ideal | - KPI cards show Total GP Revenue, Total Case Revenue, Lab Deductions, Doctor Commission (40%), Overhead, Net Profit/Loss<br>- Net Profit/Loss visually distinct when positive vs negative (e.g. color) |
| Empty | - First month / no data yet → all KPIs show 0, not blank or "undefined" |
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

## 7. Admin Portal — Carry Forward

| State | Checklist |
|---|---|
| Ideal | - Single action: counts unsettled CASE balances (N of total) and moves them to the next month<br>- Success message reports how many cases moved |
| Empty | - No unsettled cases → button disabled, count shows 0 |
| Loading | - Button shows spinner and disables during the move — action must not be interruptible mid-way |
| Error | - Carry-forward fails partway → clear failure message; no records left half-moved (retry guidance) |
| Edge case | - Cases with Balance > 0 are the only ones moved — fully paid cases stay in the current month<br>- Double-click the button → second click blocked while loading<br>- Next month's bucket auto-created on first carry-forward |

---

## 8. Registered Patients (Admin + Assistant)

| State | Checklist |
|---|---|
| Ideal | - Table lists every registry patient: #, Patient ID, Registered (`d.M.yy`), Name, Address<br>- Rows sorted newest registration first; clicking a row routes to `register-patients/detail?id=<ID>` and opens the patient detail dialog<br>- Search box filters by Patient ID or name as you type; patient count updates live<br>- "Add Patient" button (hidden for SUPERVISOR) opens the registration dialog: fields for Patient ID*, Name*, Age*, Gender*, Address, Drug Allergy, Past Dental History, Current Medications, Past Medical History; duplicate Patient ID blocked on blur and on save (23505 banner) |
| Empty | - Registry has no patients → "No registered patients yet." with an "Add Patient" button that opens the patient registration dialog (hidden for SUPERVISOR)<br>- Search matches nothing → "No patients match “query”." and count shows 0 |
| Loading | - Table skeleton (5 columns) while the registry loads<br>- Detail dialog shows skeleton lines while the patient row is fetched; Back button shows a spinner |
| Error | - Registry fetch fails → destructive error banner with Retry (refetches)<br>- Detail fetch fails → error banner inside the dialog with Retry<br>- Messages are human-readable, never raw server errors |
| Edge case | - Missing address or `created_at` → em dash placeholder<br>- Long patient names/addresses truncate with ellipsis, full value on hover (`title`)<br>- Unknown or deleted `?id=` → dialog shows "Patient `<ID>` was not found."<br>- Missing `?id=` → dialog shows "No Patient ID was provided." (no network call)<br>- 100+ patients → pagination (10 per page); search and counts apply across all pages |

---

## Cross-cutting checklist (applies to all screens)

- [ ] Role permissions respected in every state (Assistant never sees financial totals or lab fees, per PRD Section 2)
- [ ] All currency values use consistent formatting and decimal places
- [ ] All error messages are human-readable, never raw system/server errors
- [ ] Loading states never block the whole app — only the relevant section
- [ ] Forms preserve user input if a save fails (no silent data loss)
- [ ] Mobile/responsive check not required (PRD specifies Desktop/PC optimized, per Section 5.1)
