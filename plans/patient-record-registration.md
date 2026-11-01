# Patient records without prior registration

Approved design: visits identify patients by permanent UUID. Clinic IDs are optional,
unique, permanently reserved registration information. New unregistered patients
require name, age, and gender. Registration promotes the same profile; unregistering
preserves its ID and history. Both patient selection and monthly visits support
name/ID, address, age, gender, and status filters. Registration has two tabs.

## Implementation ledger

- Database: migration and rollback-based SQL coverage authored; not applied or run.
- Patient services/types/search: implemented.
- Record entry and filtering: implemented.
- Registration and profile routes: implemented.
- Documentation and regression coverage: 33 test files / 216 tests passed after user authorization.
- Final static review: independent review completed; findings corrected. TypeScript, lint,
  and `git diff --check` pass. Database scripts remain unrun for manual verification.

## Rulings

- Use the user's existing `patient_record_update` branch; do not create a second checkout.
- Tests were initially deferred, then authorized and run. One obsolete GP assertion was updated to expect the UUID patient source and zero initial payment.
- Do not commit. Do not apply migrations to a remote database.
- Context7 tools are unavailable. Official Supabase/React documentation was checked as a fallback.
- Preserve old registered-save RPC signatures and ledger requests; insert triggers fill UUID links for legacy callers.
- Dependency installation used `npm ci --ignore-scripts`; no lifecycle scripts or tests ran.
- Review fixes: reset patient/treatment state on visit selection, avoid profile-lock inversion
  on visit updates, and merge cached demographics after spreading the existing record.
- Keep whole-number monetary validation consistent with the existing PostgreSQL integer columns.
