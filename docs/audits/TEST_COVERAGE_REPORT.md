# Test Coverage Report

**Review date:** 2026-10-09  
**Test execution:** Full Vitest suite passed: 152 passed, 10 skipped, 162 total across 20 files.

## Test organization

All retained tests are centralized under `tests/`:

- `tests/unit/` — formatting, validation, type mapping, and deterministic calculations.
- `tests/component/` — forms and components with essential user interactions.
- `tests/integration/` — DataContext, service, hook persistence, server actions, and cross-boundary behavior.

Vitest discovery is restricted to `tests/**/*.test.{ts,tsx}`. Twenty test files are currently present: 5 unit, 5 component, and 10 integration files. The focused authorization and carry-forward run also passed all 4 tests.

## Essential coverage

| Critical behavior | Coverage |
|---|---|
| Payment totals and remaining balance | `tests/integration/DataContext.test.tsx`; payment input validation in `tests/component/PaymentDialog.test.tsx`. |
| Patient identity and visit integrity | `tests/integration/patientRecordService.test.ts`, `tests/integration/patients.test.tsx`, and `tests/component/PatientRecordUpdateForm.test.tsx`. |
| Financial formulas | `tests/component/useDashboardKPIs.test.tsx` covers revenue, lab fees, commission, overhead, and net profit/loss. |
| Financial persistence and month requests | `tests/integration/useFinancials.test.ts` and `tests/integration/DataContext-month-requests.test.tsx`. |
| Admin authorization | `tests/integration/admin-authorization.test.ts` verifies unauthenticated callers cannot delete users and Assistant/Supervisor callers cannot update roles; all are rejected before service-role client access. Other admin actions share the same guard but are not individually tested. |
| Carry-forward | `tests/integration/carry-forward.test.tsx` verifies only unsettled Case records move, while payments, balance, settled Case records, and GP records are preserved. |
| Account security | `tests/integration/settings-actions.test.ts` and `tests/component/AccountSettingsModal.test.tsx` cover authenticated settings actions and password-change behavior. |

## Remaining limitations

- The new authorization test verifies the server-action guard. It does not execute PostgreSQL Row-Level Security policies against a live Supabase database.
- Ten dialog tests remain explicitly skipped in `tests/component/PatientRecordUpdateForm.test.tsx` because of Base UI/JSDOM limitations; the focused new tests are not skipped.
- These tests cover selected critical behavior, not every screen state or UI presentation detail.
