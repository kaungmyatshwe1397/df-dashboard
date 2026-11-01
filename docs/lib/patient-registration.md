# Patient identity, registration, and visits

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
