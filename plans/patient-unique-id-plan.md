# Plan v2 — Unique Patient ID + Patient Demographics + Returning-Patient Flow

## Context

| Item | Detail |
|------|--------|
| Problem | Duplicate patient IDs are allowed (DB only enforces uniqueness per month/cycle; form performs no duplicate check). |
| Goal 1 | Every patient has one globally unique ID forever — no duplicate registration ever. |
| Goal 2 | Rich patient registry: age, gender, drug allergy, past medical history (dynamic enum), past dental history, current medication list. |
| Goal 3 | Patient must be registered first. Record entry verifies the registry ID, then allows GP or Case details; unknown IDs link to patient registration. |
| Confirmed decisions | Global lifetime uniqueness · `patients` master table · patient registration and record creation are separate flows · DB reset OK (dev) · no seed data · assistant deletes records only, never patients · idempotent save (no ghost rows) · keep `DataContext.tsx` thin (module-per-responsibility) · shadcn-only UI · update both `.mmd` docs. |
| Out of scope | Admin panel CRUD UI for past-medical-history options (table + fetch prepared now; UI later). Record table columns stay unchanged. |

### Root cause today

- Unique index is `UNIQUE (patient_id, cycle_id)` in `supabase/migrations/20260908000000_initial_schema.sql` — same ID slips through in any other month.
- Form validation (`components/records/patient-record-update-form/index.tsx`) checks only non-empty; no duplicate lookup before save.

---

## Task Breakdown (do in order)

### Phase A — Database Foundation

#### Task A1 — Create `medical_history_options` reference table
- New migration file `supabase/migrations/<timestamp>_add_patients_table.sql`.
- Table: `id` (uuid PK), `name` (text, unique).
- Insert default option list in the migration (not seed): Heart Disease, Hypertension, Diabetes, RA, TB, Hepatitis B, Hepatitis C, R, Stroke, SLE, Asthma — conflict-safe so re-runs are harmless.
- Enable RLS: SELECT for ADMIN + ASSISTANT; INSERT/UPDATE/DELETE for ADMIN only (admin manage UI comes later).
- **Why first:** patients table references this conceptual picklist; order keeps migration readable.

#### Task A2 — Create `patients` master table
- In the same migration:
  - `gender` enum type: `MALE`, `FEMALE`, `OTHER`.
  - Columns: `id` uuid PK · `patient_id` text **UNIQUE** (e.g. `0001/26`) · `patient_name` not null · `age` smallint not null with sensible range check · `gender` not null · `address` optional · `drug_allergy` optional text · `past_dental_history` optional text · `current_medications` text[] default `{}` · `past_medical_history` text[] default `{}` (snapshot of selected option names — resilient to later admin renames/deletes) · `created_at` timestamp.
- Enable RLS: SELECT/INSERT/UPDATE — ADMIN + ASSISTANT; DELETE — ADMIN only.
- **No seed data** for patients (or any other table).

#### Task A3 — Link records to patients, fix uniqueness
- Same migration:
  - Add FK: `patient_records.patient_id` → `patients.patient_id`.
  - **Drop** index `idx_patient_records_patient_id_cycle` (a patient may now have many visit records, including in the same month).
- Patient-facing columns on `patient_records` remain exactly as today — no new columns on records.

#### Task A4 — Delete permissions
- Same migration: new RLS policy granting ASSISTANT `DELETE` on `patient_records` (assistant can remove a record from the records list).
- `patients` DELETE stays ADMIN-only — assistant can never delete from the patient registry.

#### Task A5 — Atomic save RPC (idempotency, no ghosts)
- Follow-up migration: Postgres function `register_patient_with_record(p_patient jsonb, p_record jsonb)`:
  - Single transaction: require an existing patient registry row, then insert the visit record only.
  - Unknown patient ID raises a registration-required error; any failure leaves no partial visit.
- Patient registration stays in the Registered Patients flow; record creation cannot create or modify a patient.

#### Task A6 — Remove seed data
- Empty `supabase/seed.sql` (leave a comment stub only). Fresh DB starts with labs, cycles, records all empty; only the PMH default options exist (from A1).
- Verify: `supabase db reset` applies all migrations with no seed run and no errors.

**Phase A checkpoint:** reset DB → cannot insert two patients with same `patient_id` → `patient_records` rows must reference an existing patient → no old per-cycle index remains.

---

### Phase B — Types & Service Layer (keep modules small)

#### Task B1 — TypeScript types in `lib/global.ts`
- `PatientType` (matches patients table; suffix `Type` per naming rule).
- `MedicalHistoryOptionType`.
- Keep existing `PatientRecord` types unchanged.

#### Task B2 — `lib/services/patientRecordService.ts` (new, single responsibility)
- `registerPatientWithRecord(...)` — wraps the record-only RPC; unknown IDs require prior registration.
- `findLatestRecordByPatientId(...)` — record lookup returning the most recent visit (needed now that one patient can have several records).
- All Supabase save/lookup calls for this feature live here — **not** in DataContext.

#### Task B3 — `context/hooks/usePatients.ts` (new, mirrors `useLab` pattern)
- `findPatientById(patientId)` — global query against `patients` (not month-scoped).
- `updatePatient(...)` — updates demographics and propagates `patient_name`/`address` to that patient’s records so tables stay consistent.
- `deletePatient(...)` — admin-only path (not wired into assistant UI).

#### Task B4 — `context/hooks/useMedicalHistoryOptions.ts` (new, mirrors `useLab`)
- Fetch option list once; add/update/delete with duplicate-name rejection (future admin panel uses this as-is).

#### Task B5 — Thin `context/DataContext.tsx` wiring only
- Compose B3/B4 hooks; expose their functions through context.
- Route record creation through `registerPatientWithRecord` (service), remove any direct two-step patient+record insert logic.
- **Rule:** no new business logic in DataContext — only orchestration/re-exports.

**Phase B checkpoint:** `npm run typecheck` passes; DataContext diff is mostly wiring; service/hooks testable in isolation.

---

### Phase C — Form UI (shadcn only)

#### Task C1 — Install missing shadcn component(s)
- `npx shadcn@latest add field` (Field / FieldLabel / FieldDescription / FieldError for label + hint + inline error composition).
- Already available (do not rebuild): `Input`, `Textarea`, `RadioGroup`, `Select`, `Checkbox`, `Combobox`, `Badge`, `Button`, `Alert`, `AlertDialog`, `Dialog`, `Label`, `Spinner`, `Skeleton`.

#### Task C2 — Split form folder (flat camelCase siblings, per `docs/project-folder-rules.md`)
```
components/records/patient-record-update-form/
├── index.tsx                    (orchestrator: modes, lookup, returning-patient state)
├── patientInfoSection.tsx       (age, gender, drug allergy, past dental history)
├── medicalHistory.tsx           (PMH multi-select from dynamic options)
├── currentMedicationList.tsx    (chip list editor: input + add + remove)
├── RecordFormFields.tsx         (GP treatment/cost — unchanged)
├── CaseFormFields.tsx           (CASE treatment/cost — unchanged)
└── Types.ts                     (extended form state + returning-patient types)
```

#### Task C3 — shadcn component mapping for new fields
| Field | Component(s) |
|-------|----------------|
| Age | `Input` type=number inside `Field` |
| Gender | `RadioGroup` (MALE/FEMALE/OTHER) |
| Drug allergy | `Input` or `Textarea` (optional) |
| Past Medical History | `Combobox` with multi-select + chips (scales as options grow) |
| Past Dental History | `Textarea` (optional) |
| Current Medication | `Input` + `Button` add → `Badge` chips with remove |
| Duplicate-ID warning | `Alert` |
| Delete confirm | `AlertDialog` |
| Validation | `FieldError` / inline text under each field (never a generic alert alone) |

#### Task C4 — Add-mode Patient ID lookup behavior
- On blur / Enter: `findPatientById`.
  - **Not found** → prompt to register the patient first and link to Registered Patients; do not render record fields or allow save.
  - **Found** → show the patient name from the registry; only treatment/cost and case fields are editable → save inserts a **new visit record only** (`entry_date` = today).
  - **Unknown ID** → prompt to register first; changing the ID and searching again can find a registered patient.
  - **Save-time registry race** → clear registration-required `Alert`; form values are preserved.

#### Task C5 — Edit-mode behavior
- Patient ID locked (identity immutable).
- Demographics section editable → `updatePatient` (propagates name/address to records).
- Treatment/cost editing unchanged.

#### Task C6 — Delete from records
- Existing record Delete button: now also available to assistant (policy from A4), keeps `AlertDialog` confirm.
- Deleting a record never touches the `patients` row (registry entry intentionally remains).

**Phase C checkpoint:** all 5 UI states (ideal / empty / loading / error / edge) for the modal covered per `docs/dc-fms-ui-states-checklist.md`.

---

### Phase D — Documentation (both MMD files — careful, surgical edits)

#### Task D1 — `docs/dc-fms-erd.mmd`
- Add `PATIENTS` entity with all columns; `patient_id` noted *globally unique, e.g. 0001/26*.
- Add `MEDICAL_HISTORY_OPTIONS`.
- Relationship: `PATIENTS ||--o{ PATIENT_RECORDS : "visits (many per patient)"`.
- `PATIENT_RECORDS.patient_id` → FK to patients; **remove** “unique per cycle” wording; confirm no new record columns.
- Note in comments: PMH/medications stored as `TEXT[]`; options table managed like labs/case_types (admin UI later).

#### Task D2 — `docs/dc-fms-user-flow.mermaid`
- Add → *Enter Patient ID* → decision *Already registered?*
  - No → prompt to register patient first; return to Add Record after registration.
  - Yes → show registry identity → treatment/cost only → Save (new visit record).
- Add patient-registration-required path for unknown IDs.
- Add *Delete Record* (Admin + Assistant, confirm) — never deletes patient.
- Admin subgraph: add *Manage Medical History Options* (marked “later”).

#### Task D3 — `docs/dc-fms-ui-states-checklist.md` §3
- Add: required age/gender inline errors · PMH no-options hint · medication chip add/remove · returning-patient locked/disabled styling · duplicate-ID alert · RPC failure banner with no partial save · assistant-visible Delete.

**Phase D checkpoint:** both MMDs render without syntax errors; docs match implemented behavior.

---

### Phase E — Tests & Verification

#### Task E1 — Component tests (`components/records/__tests__/PatientRecordUpdateForm.test.tsx`)
- [x] Unknown ID → registration-required prompt; record form stays unavailable
- [x] Registered ID → registry name shown; identity locked; treatment editable
- [x] Unknown ID → register-first prompt; change ID and search again
- [x] Save → service called with registered patient ID + record payload
- [x] Save → registered patient ID + new visit payload
- [x] Missing registry row at save → registration-required error in Alert; dialog stays open
- [x] Edit mode → Patient ID disabled; demographics editable
- [x] `currentMedicationList` add/remove chip; empty allowed
- [x] `medicalHistory` multi-select toggles; empty allowed

#### Task E2 — Hook/service tests
- [x] `registerPatientWithRecord` error mapping + success payload (`lib/services/__tests__/patientRecordService.test.ts`)
- [x] `findPatientById` returns demographics / null (`context/__tests__/patients.test.tsx`)
- [x] Latest-visit record lookup — covered in `patients.test.tsx` via latest-first `findRecordByPatientId` (deviation: dedicated `findLatestRecordByPatientId` service fn not created; sort lives in the existing lookup)
- [ ] `useMedicalHistoryOptions` add/update/delete + duplicate-name reject — **deferred**: hook skipped entirely (no admin CRUD caller yet; options are fetched in `DataContext.fetchReferenceData`). Revisit with the admin manage UI.
- [x] `usePatients.updatePatient` propagates name/address to records

#### Task E3 — Regression
- [x] Update existing `DataContext*.test.tsx`, form tests for RPC path + empty seed
- [x] Assistant delete record allowed; assistant cannot delete patients — asserted via RLS policies in migration (`records_delete_assistant`, `patients_delete_admin`); automated role-based policy test left as integration check (mock Supabase does not evaluate RLS)

#### Task E4 — Commands & manual QA
1. [x] `npm run lint` · `npm run typecheck` · `npm run test` — all green (1 pre-existing `exhaustive-deps` warning in DataContext `addPayment`, unrelated to this plan).
2. [x] `supabase db reset` (no seed) — done by user.
3. Manual script — **pending user QA:**
   - Register MGMG `0001/26` in Registered Patients → row in `patients` only.
   - Add MGMG's GP or Case visit using `0001/26` → row in `patient_records` linked to the existing patient.
   - Try adding a visit for an unknown ID → registration prompt; database rejects direct RPC attempts.
   - Take network offline mid-save → fail → verify no partial visit record (RPC transaction rollback).
   - Assistant deletes a record → record gone, patient remains in registry.

---

## Execution order summary

| # | Task | Outcome |
|---|------|---------|
| A1–A5 | Migration (options, patients, FK/index swap, delete RLS, RPC) | DB enforces global uniqueness + atomic save |
| A6 | Clear seed | Clean dev DB |
| B1–B5 | Types → service → hooks → thin DataContext | Logic in modules, not God file |
| C1–C6 | shadcn field + form split + lookup/returning/delete UX | Working add/edit/returning flows |
| D1–D3 | ERD + user-flow + UI-states docs | Docs match reality |
| E1–E4 | Tests + lint/typecheck/test + manual QA | Verified result |

## Definition of Done

- Same `patient_id` can never belong to two people (DB-enforced, global, forever).
- Duplicate registration shows: *"This Patient ID is already registered. Please use a different ID."*
- Record entry: registered ID lookup shows the registry identity; only treatment and cost fields are editable; new visit record saved.
- Failed save leaves zero partial rows (RPC transaction).
- Assistant can delete records only; patient registry deletions are admin-only.
- No seed data; both MMD files updated; lint/typecheck/tests pass.
