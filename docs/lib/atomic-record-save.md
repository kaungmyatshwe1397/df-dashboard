# Atomic record creation and safe retries

## Behavior

`DataContext.addRecord` calls `save_registered_record` once. Cycle creation, registry verification, visit insertion, initial CASE payment insertion, and submission acknowledgement commit together. A failure leaves no partial visit or initial receipt. The active month and local records/payments change only after a confirmed response.

The form sends a stable submission UUID on every retry. The private ledger stores the user, request JSON, and result. Simultaneous retries wait for the first transaction. A matching committed request returns the same record/payment IDs. A changed request under that ID is rejected; restore the original values and retry, then edit the recovered visit. A rolled-back submission has no ledger entry, so its values can be corrected before retrying.

Resetting/closing the dialog creates a new submission next time. Recovery of an uncertain submission across a browser reload is not included. Later installment entry and record editing are unchanged.

## Migration

Apply `supabase/migrations/20261011000000_atomic_record_save.sql` to the intended Supabase environment before deploying the frontend. The migration adds the private `record_save_submissions` table and the `save_registered_record` RPC. It retains the old registry RPC for compatibility. Browser roles cannot read or modify ledger entries.

## Checks for the user to run

No tests, lint, or typecheck were run after these changes, as requested.

```powershell
npm test
npm run typecheck
node node_modules/eslint/bin/eslint.js context/DataContext.tsx lib/services/atomicRecordSaveService.ts components/records/patient-record-update-form/index.tsx test-setup.ts tests/unit/atomicRecordSaveService.test.ts tests/integration/backdated-record-entry.test.tsx tests/component/BackdatedRecordForm.test.tsx
git diff --check
```

After applying all migrations to a disposable local/staging database, run the PostgreSQL assertions:

```powershell
psql "$env:ATOMIC_SAVE_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/atomic_record_save.sql
```

The SQL script creates test users/patient, injects a payment failure, checks transaction rollback, repeats an identical submission, rejects changed data and cross-user replay, and checks private-ledger/anonymous permissions. Fixtures are rolled back. It requires a privileged database connection for fixture setup; it is not a browser RPC.

For concurrent retry verification, run the same RPC parameters and submission UUID under the same authenticated test user in two database sessions. Confirm both return identical record/payment IDs and only one row exists for each. For network recovery, drop the RPC response after a commit and retry the unchanged form; check that the payment total is unchanged.

## Deferred verification TODO

- [ ] Run Vitest regressions and the existing complete test suite.
- [ ] Run TypeScript, focused ESLint, and diff checks.
- [ ] Run SQL assertions against the actual PostgreSQL migration.
- [ ] Verify concurrent retries in two sessions.
- [ ] Verify real browser response-loss recovery and role access.
