# Patient identity, registration, and visits

## One-page Case entry (2026-11-07)

Case entry now opens directly with name, age, gender, optional address/telephone,
record date, case type, optional teeth, total cost, and amount paid today. Payment
defaults to zero; remaining balance is calculated live. Optional lab name and dates
stay in a collapsed shadcn panel and can be added or cleared in Edit later. Existing
saved lab details open automatically. No registry lookup, duplicate prompt, status
decision, or registry write is performed. Recognition of old/new patients is deferred.

The `record_patient` source selects `save_case_record(uuid,jsonb,jsonb,integer)` for
Case. It saves the passive month bucket, standalone Case snapshot, optional initial
receipt, and private retry ledger atomically. Identical retries return the same case
and receipt; changed requests under a committed submission are rejected. The frontend
checks receipt acknowledgements before confirming a paid save. Further installments
and carry-forward retain the existing record UUID workflow.

**Rollout required:** Review and apply
`supabase/migrations/20261107000002_standalone_case_records.sql` after the two GP
and telephone migrations before enabling new Case saves. No database migration or
SQL fixture has been executed by the coding agent; local database is production.
The migration allows valid standalone Case snapshots, protects immutable identity
and category, and applies cost-versus-receipt checks to standalone Case edits.
Existing profiles, records, payments, and legacy save RPCs are preserved.

Verification TODOs:

- [x] Run prepared Case entry/save/edit tests and the full mocked suite with one worker:
  42 files / 258 tests passed. TypeScript, lint, and whitespace checks passed.
- [ ] Run `supabase/tests/standalone_case_records.sql` only on disposable staging
  after migration review, including rollback, replay, privilege, and balance checks.
- [ ] Verify narrow-screen/keyboard entry and optional lab panel in isolated staging.
- [ ] Verify late lab assignment, receipt entry, and carry-forward end to end on staging.

Historical linked-patient workflows below remain for compatibility; the new direct
Case form replaces the former Case patient-ID gate.

The focused run initially found one outdated test expecting the former lab
placeholder. The test now uses the Lab Name label; the subsequent full suite passed.
Independent static review found no material issues. SQL and browser/staging checks
remain unrun. No commit was created for the Case changes.

## Standalone GP entry (2026-11-07)

GP Add Record now opens the visit form directly. Name, age (0-120), and gender
(Male/Female) are required; address and telephone are optional. Date, diagnosis/treatment, and
positive whole-number cost remain required. Patient matching, ID lookup, clinical
history, and registration decisions are omitted from this flow.

GP entry sends `record_patient` to the existing save adapter, which invokes the new
`save_gp_record(uuid,jsonb,jsonb)` RPC. This stores demographics on `patient_records`
with null patient UUID/clinic ID. It never writes to `patients`, never classifies
the person as unregistered, and creates no receipt. Old/new patient identification
and linking are deferred. Existing linked visits and Case contracts below remain.

**Rollout required:** `supabase/migrations/20261107000000_standalone_gp_records.sql`
must be reviewed and applied before using this frontend. It adds nullable visit age
and gender, allows null UUID only for GP with valid demographics, preserves linked
identity protections, and adds an Admin/Assistant-only, retry-protected save RPC.
No existing visit/profile is deleted, detached, or backfilled. No database changes
have been applied by the coding agent; the local app connects to production.

Apply `20261107000001_record_telephone.sql` after the standalone GP migration. It
adds optional visit telephone storage and extends the GP save RPC. GP add and edit
share a dedicated record-only field group. Older linked GP edits also omit registry
IDs, status badges, medical history, and medication controls; hidden clinical fields
are preserved. The edit popup uses two side-by-side shadcn cards on wider screens,
stacking on mobile, with Delete, Cancel, and Save Changes in its footer.
If an older linked profile cannot be loaded, demographic fields stay disabled to
avoid discarding edits; telephone and treatment remain editable on the visit.

The monthly list and edit picker search standalone visit demographics. Registration
status filters exclude these visits from both Registered and Unregistered results
because their registration is unknown. Editing updates the visit only. An uncertain
save locks fields and offers Retry save with the same submission and original values.

### Verification TODO

- [x] Run prepared mocked component/unit tests after user permission: direct GP form,
  standalone save/map/filter, edit without registry access, validation, consecutive
  entries, retry identity, and existing Case entry coverage.
- [x] Run the full Vitest suite after user permission: 41 files / 257 tests passed.
- [ ] Run `supabase/tests/standalone_gp_records.sql` only on a disposable staging
  database after reviewing the migration. Never run fixtures on this production DB.
- [ ] Verify mobile/keyboard GP entry and edit against isolated staging.
- [ ] Rehearse the migration on a production copy and compare existing profile,
  visit, payment, and ledger counts; check linked Case/GP saves still work.

Mocked verification passed: 41 files / 257 tests with one worker. TypeScript, lint,
and whitespace checks passed. A parallel focused run timed out on an existing Case
retry test; rerunning with one worker passed. Vite emits an existing warning about
`__dirname` in the test config. SQL scripts and migrations remain unexecuted.
Repeatable commands:

```powershell
npm test -- tests/component/NewGpRecord.test.tsx tests/component/NewCaseRecord.test.tsx tests/component/PatientRecordUpdateForm.test.tsx tests/unit/standalone-gp-save.test.ts tests/unit/standalone-case-save.test.ts tests/unit/unregistered-record-save.test.ts
npm test
npx.cmd vitest run --maxWorkers=1
```

The historical workflow below describes linked identities and Case entry.

Every patient has a permanent UUID (`patients.id`). Visits reference that identity
through `patient_records.patient_uuid`, including when no clinic book ID exists.
`patient_id` is the optional clinic ID. Assigned IDs remain unique and reserved
through unregister/re-register operations. Registered profiles require a clinic ID.

## Workflow

1. Add GP or Case record opens a full-page form. The assistant checks a clinic ID or chooses an unregistered patient before entering a visit.
2. A found clinic ID shows patient details for confirmation. An unused current-year ID creates a registered profile in the visit-save transaction. Save & add another saves the current visit, then starts a blank patient entry with the visit date carried forward.
3. Select an existing profile by clinic ID or global patient search, or choose New unregistered patient. Changing patient preserves the treatment draft.
4. New profiles require name, integer age 0–120, and Male or Female. Address and medical
   history are optional. A potential-match warning requires explicit selection or
   confirmation that this is a separate person; profiles are never automatically merged.
5. The atomic save creates any new profile, cycle, visit, and initial CASE payment.
6. Patient Registration has Registered and Unregistered tabs. Registering an
   existing profile assigns a current-year clinic ID to that same UUID. Unregister
   changes status only. Re-registering reuses the previously assigned ID, even in
   a later year. Profile creation time and first registration time are separate.

Global search is server-paginated (10 per page) and treats text as literal substrings.
Name/ID is an OR match; address, exact age, gender, and status combine with AND.
Monthly visit filters use current patient demographics within the selected month
and GP/Case tab. Select the actual visit to edit; no latest-visit shortcut is used.
The existing address field supplies location. Age remains stored age, not date of birth.

The frontend uses UUID profile links (`?uuid=`). Existing clinic-ID links (`?id=`)
continue working. Missing clinic IDs display Not assigned.

## Save and permission guarantees

`save_patient_record(uuid,jsonb,jsonb,integer)` accepts exactly one source:
`{"existing_patient_uuid":"..."}` or `{"new_patient":{...demographics...}}`.
GP and Case entry may also pass `register_existing` and `register_patient_id` with a matched UUID, or an optional
`patient_id` with new demographics. Both registration changes happen within the
visit-save transaction.
The private submission ledger records a versioned canonical request, owner, and
result. Identical retries recover the result; changed requests under a committed ID
are rejected. Failures roll back the new patient as well as visits and receipts.
Closing/resetting starts another submission; submission identity does not survive reload.

Admin and Assistant can create/edit patients and manage registration. Supervisor is
read-only. New endpoints return no financial totals or lab-fee assignments. Database
triggers prevent UUID reassignment, clinic-ID clearing/reuse, and partial propagation
of name/address/clinic ID to visits. Payment operations own installment totals;
visit edits cannot change paid amounts and reject costs below existing receipts.

Legacy registered-save RPC signatures and ledger contracts are retained. Their inserts
resolve UUIDs from clinic IDs through the visit trigger. The old TypeScript addRecord
string argument remains available for compatibility; the new UI always supplies a UUID
or new-profile payload.

## Release and manual verification

Apply `supabase/migrations/20261101000003_registered_patient_visit_save.sql` before enabling full-page GP and Case entry. It extends the existing retry-protected visit save to register a new clinic ID, assign a checked ID to an existing unregistered profile, or re-register a matched profile in the same transaction. Apply `supabase/migrations/20261101000004_unregistered_added_sort.sql` for correct creation-date ordering in the Unregistered tab.

Apply `supabase/migrations/20261101000001_patient_directory_sort.sql` after the registration-status migration. The directory sort control requires this RPC for stable ordering across pages.
Apply `supabase/migrations/20261101000002_patient_directory_sort_order.sql` afterward to preserve the selected order in the returned JSON array.

Test TODOs: add component coverage for Edit and Register/Unregister from the patient profile, including supervisor read-only behavior; add database coverage for each sort key and direction across page boundaries.

Apply `supabase/migrations/20261101000000_patient_registration_status.sql` before the
frontend release during a brief entry pause. The migration backfills all existing
profiles as registered and links every visit; an unresolved link aborts the migration.
No migration has been applied by the coding agent. Do not roll back by dropping UUID
links after unregistered visits exist; retain the schema and use a forward fix.

After deployment, verify both roles can search a returning patient without a book,
save an unregistered GP/Case visit, promote that profile without losing receipts,
unregister/re-register it, and edit a specific visit. Verify Supervisor cannot write.
Check mobile entry and all loading, error, empty, no-match, and duplicate states.

Local verification passed: 33 test files / 216 tests, TypeScript, lint, and whitespace checks.
One outdated GP assertion was corrected to expect the UUID source and zero initial payment.
Database migration and SQL scripts remain unrun for manual verification. Repeatable commands:

```powershell
npm test -- tests/unit/patient-search.test.ts tests/unit/unregistered-record-save.test.ts tests/component/PatientRecordUpdateForm.test.tsx tests/component/BackdatedRecordForm.test.tsx tests/component/PatientRegistration.test.tsx tests/component/PatientSearch.test.tsx
npm test
npm run typecheck
npm run lint
npm run build
```

Run `supabase/tests/patient_registration.sql` and `supabase/tests/atomic_record_save.sql`
manually on a disposable local/staging database. Both roll back their fixtures.

## Deferred test TODOs

- [ ] Two independent database sessions concurrently retrying the same submission.
- [ ] Registration versus visit insertion concurrency and profile edit synchronization.
- [ ] Browser keyboard/mobile verification of the searchable picker, status tabs, and visit selection.
- [ ] Full migration rehearsal against a copy of existing production data, comparing visit/payment counts.

Context7 was unavailable during implementation. Official Supabase database-function
and React effect documentation were checked as a fallback; no dependencies were added.

Static verification: `npm run typecheck`, `npm run lint`, and `git diff --check` passed.
Dependencies were installed from the existing lockfile with lifecycle scripts disabled.
No build, SQL verification script, migration application, or commit was performed.
