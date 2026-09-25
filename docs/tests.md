# Tests

## Summary

| Metric | Count |
|--------|-------|
| Test files | 19 |
| Total tests | 166 |
| Passing | 156 |
| Skipped | 10 |

## Unit Tests (7 files, 45 tests)

Pure function tests — no React/DOM.

| File | Tests | What it covers |
|------|-------|---------------|
| `lib/__tests__/mock-data.test.ts` | 7 | `getCycleByMonth`, `getRecordsByCycle`, `getPaymentsByRecord` |
| `lib/data-helpers.test.ts` | 15 | `getMonthLabel`, `getNextMonthLabel`, `toPatientRecord`, `toCustomOverhead` |
| `lib/utils.test.ts` | 3 | `cn()` Tailwind class merger |
| `components/records/patient-record-update-form/Types.test.ts` | 4 | `getInitialForm()` for GP/Case records, optional-field fallbacks, registry patient prefill |
| `components/overhead/Types.test.ts` | 6 | `financialsToFields`, `customOverheadsToForm` |
| `components/records/record-table/RecordTableHelpers.test.ts` | 6 | `formatCurrency`, `formatDate` |
| `lib/services/__tests__/patientRecordService.test.ts` | 4 | `registerPatientWithRecord` RPC success, duplicate-ID (23505) mapping, error passthrough |

## Component Tests (12 files, 121 tests)

React component and hook rendering with Testing Library.

| File | Tests | What it covers |
|------|-------|---------------|
| `components/__tests__/CaseTable.test.tsx` | 3 | Empty state, add button |
| `components/__tests__/RecordTable.test.tsx` | 6 | Tab rendering, tab switching, add buttons, record count |
| `components/__tests__/PaymentDialog.test.tsx` | 2 | Form validation (empty amount, exceeds remaining) |
| `components/records/__tests__/PatientRecordUpdateForm.test.tsx` | 27 | Dialog close, edit/add mode, delete button, form validation, patient registry (returning/locking), save flows, medication chips, medical history |
| `components/records/record-table/RecordTableHelpers-components.test.tsx` | 6 | `TableEmpty`, `TableError`, `TableSkeleton`, `TablePagination` |
| `components/dashboard/useDashboardKPIs.test.tsx` | 8 | KPI calculations (revenue, commission, overhead, profit) |
| `context/__tests__/DataContext.test.tsx` | 14 | Payment logic, CRUD operations, record lookup |
| `context/__tests__/DataContext-mutations.test.tsx` | 13 | Record/patient mutation flows through DataContext |
| `context/__tests__/patients.test.tsx` | 7 | Patient registry lookup and persistence |
| `context/__tests__/useFinancials.test.ts` | 13 | Monthly financials hook |
| `context/__tests__/useLab.test.ts` | 11 | Labs hook |
| `context/__tests__/useCaseType.test.ts` | 11 | Case types hook |

## Skipped Tests (10)

All skipped due to **base-ui Dialog JSDOM limitations** — need Playwright E2E:

| Test | Reason |
|------|--------|
| Overlay click closes dialog | JSDOM doesn't render overlay backdrop events |
| ESC key closes dialog | JSDOM doesn't propagate Escape to dialog content |
| X button hidden while saving | Requires form submission to trigger saving state |
| Add GP mode shows GP form fields | Label-input association broken in JSDOM |
| Add Case mode shows case-specific fields | Label-input association broken in JSDOM |
| GP form error: empty diagnosis | Requires form submission |
| GP form error: zero cost | Requires form submission |
| Case form error: empty case type | Requires form submission |
| Case form error: paid exceeds cost | Requires form submission |
| Form resets on reopen | Dialog re-render with new props unreliable in JSDOM |

## Future Tests to Add

| Priority | What | Type | Why |
|----------|------|------|-----|
| High | Middleware route protection (`middleware.ts`) | Unit | Auth/RBAC logic untested |
| High | `isProtectedRoute`, `isAdminRoute` | Unit | Pure functions, easy to test |
| Medium | `updateUserAction`, `deleteUserAction` (`app/admin/actions.ts`) | Unit | Server actions need mock |
| Medium | AuthContext (`login`, `logout`, session) | Component | Auth flow untested |
| Medium | OverheadForm validation | Component | Financial form logic |
| Medium | Reconciliation table | Component | Lab fee calculations |
| Low | `lib/supabase/__mocks__/` | Setup | Shared mock for Supabase client |
| Low | Playwright E2E for skipped Dialog tests | E2E | Full browser testing |
