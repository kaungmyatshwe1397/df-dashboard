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
| `lib/services/__tests__/patientRecordService.test.ts` | 4 | `registerPatientWithRecord` two-argument RPC success, unregistered-ID (23503) mapping, error passthrough |

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
| High | GP and Case record add flow requires an existing patient; unknown IDs show the register-first action and cannot submit | Component | Confirms the changed workflow for both record categories |
| High | `register_patient_with_record` sends only the two deployed named arguments and rejects an unknown patient ID | Unit/Integration | Prevents RPC schema-cache mismatches and blocks unregistered records at the database boundary |
| High | Patient registration followed by record creation succeeds; failed registry lookup preserves the entered ID and allows retry | Component/E2E | Covers the full register-then-record user journey |
| High | Case form passes its initial paid amount into payment creation; paid total and remaining balance reflect the amount immediately | Component/Integration | Prevents a saved Case record from showing zero paid when an initial amount was entered |
| High | Middleware route protection (`middleware.ts`) | Unit | Auth/RBAC logic untested |
| High | `isProtectedRoute`, `isAdminRoute` | Unit | Pure functions, easy to test |
| Medium | `createUserAction`, `updateUserRoleAction`, `deleteUserAction` (`app/admin/actions.ts`) | Unit | Server actions need mock |
| Medium | Users page table (`app/admin/users/page.tsx`) — rows render username/email/role, loading skeleton, empty state, error retry | Component | User management UI untested |
| Medium | `CreateUserDialog` / `UserEditDialog` validation + submit flows | Component | Admin user CRUD forms |
| Medium | Supervisor read-only gating (`useCanEdit` consumers: GpTable, CaseTable, OverheadForm, CarryForwardPanel, LabFeeInput) — hides add/edit buttons when profile.role is SUPERVISOR | Component | New role behavior |
| High | Middleware SUPERVISOR rules (`/admin` allowed read-only, `/admin/users` and `/admin/reconciliation/manage` blocked, `/assistant` blocked) | Unit | RBAC logic untested |
| Medium | AuthContext (`login`, `logout`, session) | Component | Auth flow untested |
| Medium | OverheadForm validation | Component | Financial form logic |
| Medium | Reconciliation table | Component | Lab fee calculations |
| Low | `lib/supabase/__mocks__/` | Setup | Shared mock for Supabase client |
| Low | Playwright E2E for skipped Dialog tests | E2E | Full browser testing |
