# Atomic Record Save Implementation Plan

**Goal:** Save a registered patient's visit, month cycle, and initial CASE payment in one transaction with safe retries.

**Architecture:** A PostgreSQL RPC uses a private per-user submission ledger and row lock to serialize retries. SECURITY DEFINER permits ledger access only through the RPC, which explicitly checks the authenticated Admin/Assistant role, request ownership, and whitelisted treatment fields. Identical submissions return the committed result; changed payloads under the same ID are rejected. The form retains its submission ID until the form closes/resets. Existing edit and installment flows remain unchanged.

**Authorization:** User approved implementation after discussing atomicity and idempotency. Work remains in the current checkout and uncommitted.

## Tasks

- [x] Add regressions for a committed save with a lost response, changed-payload rejection, atomic payment failure, and form retry identity (written; execution deferred).
- [x] Add a migration for the submission ledger, RLS, and transactional record-save RPC; preserve existing role permissions.
- [x] Add a focused service and replace client-side record/payment writes with the RPC; publish returned state only after success.
- [x] Remove the obsolete partial-save path and update ERD/architecture notes.
- [ ] Run regression tests, typecheck, lint, and review the SQL and retry boundaries. Record any database verification limits.

## User-directed verification

The user requested all code and documentation first and will execute the tests personally. Do not run tests, lint, or typecheck in this implementation turn. SQL assertions and Vitest regressions are included for the user to run. Docker Desktop's engine was unavailable during initial environment inspection; no live database was used.

Static code review found no blocking issue in the migration's schema, checked definer access, row locking, or client replay flow. This does not establish passing tests or live database behavior.

## Review Focus

Concurrent retries; response loss after commit; payment failures rolling back cycle/record/ledger; mismatched request reuse; cross-user submission IDs; GP and zero-payment CASE saves; no financial-total exposure to assistants.
