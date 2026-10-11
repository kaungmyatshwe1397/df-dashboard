# Backdated Record Entry Implementation Plan

Spec: `docs/superpowers/specs/2026-10-11-backdated-record-entry-design.md`

Implement in the current `pt-info-update` checkout, which is clean after the completed merge. The user explicitly requested implementation now. Do not commit, per `docs/rules/my-rules.md`.

## Constraints

- Store and validate date-only strings without UTC conversion.
- Preserve the patient registry flow, permissions, lab milestone dates, and installment history.
- Add mode supplies `entry_date`; callers that omit it retain a local-today default.
- Edit mode resolves a destination cycle only when `entry_date` actually changes. Unchanged dates preserve carried-forward cycle assignments.
- Surface save failures in the existing dialog without clearing form state or changing the active month.
- Use existing shadcn Input and FormField components with token-based styling.

## Task 1: Date validation and monthly cycle persistence

Files: `lib/record-date.ts`, `lib/services/recordCycleService.ts`, `context/DataContext.tsx`, `tests/unit/record-date.test.ts`, `tests/integration/backdated-record-entry.test.tsx`.

1. Add failing tests for local date formatting, empty/invalid/future dates, leap dates, existing and new cycles, initial CASE payment date, CASE moves preserving installment dates, unchanged carried-forward date, and failed saves preserving the selected month.
2. Add `getLocalDate(date?: Date): string` and `getRecordDateError(value: string, today?: string): string | undefined`.
3. Add `resolveRecordCycle(supabase: SupabaseClient, cycles: MonthlyCycle[], recordDate: string): Promise<MonthlyCycle>`; reuse existing cycles and handle a competing cycle insert by loading the winning row.
4. Accept an optional `entry_date` in addRecord. Resolve its month before saving, date initial payments with it, and select the destination month only after successful save.
5. For changed edit dates, update `entry_date`, `cycle_id`, and `month_label` in one database update and select the destination month afterward. Do not update installments or lab dates.
6. Run `npm test -- tests/unit/record-date.test.ts tests/integration/backdated-record-entry.test.tsx --maxWorkers=1`; expected all pass.

## Task 2: Shared record form

Files: `components/records/patient-record-update-form/Types.ts`, `index.tsx`, `recordDateField.tsx`, `tests/component/BackdatedRecordForm.test.tsx`.

1. Add failing component tests for both categories: lookup gating, local-today default, required/future validation, past-date submission, failed save persistence and disabled date during saving, edit prefill/date update, and independent CASE lab milestones.
2. Extend form state/errors with Record Date, default from the local calendar and prefill from `entry_date`.
3. Render required Record Date before category fields in verified add mode and edit mode. Set its maximum to local today and disable while saving.
4. Validate date before saving and include `entry_date` in the treatment payload.
5. Run `npm test -- tests/component/BackdatedRecordForm.test.tsx --maxWorkers=1`; expected all pass.

## Task 3: Regression checks and review

1. Update the UI-state checklist and user flow to describe date entry and destination-month selection.
2. Run focused existing form, date/type, DataContext, patient registration, and carry-forward tests alongside new tests.
3. Run `npm run typecheck`, ESLint on changed source/tests, and `git diff --check`.
4. Review the final diff against every acceptance criterion. Review focus: unchanged carried-forward records, cycle/save failures, month fetch transitions, timezone boundaries, and preservation of existing payment/lab dates.
5. Record results and leave changes uncommitted for review.

## Progress

- Planning and repository inspection complete.
- Task 1 complete: 29 date and persistence tests passed after reproducing existing add/edit failures.
- Task 2 complete: 12 component tests passed after reproducing the missing date field, including CASE milestone preservation and failed-save state.
- Task 3: 114 tests passed, 10 existing tests skipped; TypeScript, focused ESLint, and diff checks passed before review.
- Final review found a CASE partial-save visibility/retry issue. Added saved-record identity to resume the same visit, preserving the latest date and treatment corrections. Integration and component regressions reproduced the missing retry identity before the fix and passed afterward.
- Final acceptance check reproduced a CASE tab reset when a destination month reloads. `RecordTable` now keeps its tab selection outside the remounted panels; a component regression verifies the backdated CASE stays visible.
- Task 3 complete: final combined run passed 117 tests across 12 files with 10 existing skips. TypeScript, ESLint on changed source/tests, and diff checks passed. New tests were not deferred. All eight acceptance criteria were checked against source and tests. Changes remain uncommitted.

## Review decisions

The later user-approved atomic-save change supersedes the partial-payment recovery described below. See `2026-10-11-atomic-record-save.md`: new record creation now requires a migration and one transactional RPC with submission idempotency. Earlier test results apply to the implementation before this change; current checks are deferred to the user.

- Native implementation in the current clean feature checkout follows the user's request to implement now; changes remain uncommitted under project rules.
- Initial-payment failure is handled without a database migration: the existing saved visit is published and its ID is retained for an in-dialog retry. A retry updates that visit and completes its initial payment. This avoids a duplicate visit from that retry.
- Existing chart attribution and separate installment-dialog dates remain outside this feature, as the approved spec requires. Record-date changes do not rewrite payment history.
- Existing demographic and record saves remain separate writes; this feature preserves entered values when record saving fails.
- Existing month sorting is unchanged because the date feature does not alter the selector's ordering.
- Verification uses the repository's mocked Supabase test client and rendered component tests; no live database writes were performed.
