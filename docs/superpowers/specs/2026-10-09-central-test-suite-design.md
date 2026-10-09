# Central Test Suite Design

## Purpose

Keep the small set of high value automated tests in one discoverable location, grouped by test level. Add focused regression coverage for admin authorization and carry-forward behavior.

## Approved structure

```text
tests/
  unit/
  component/
  integration/
```

All current retained test files will move into one of these folders. Unit tests will cover pure data/formula behavior, component tests will cover essential user interactions, and integration tests will cover connected application boundaries such as Supabase-backed data mutations and server actions. Test imports will use the existing `@/` alias so test locations do not depend on source folder depth.

Vitest discovery will be narrowed to `tests/**/*.test.{ts,tsx}`. `test-setup.ts` remains at the project root and continues to initialize the shared Supabase mock and browser test environment.

## Essential new coverage

1. **Admin action authorization:** verify unauthenticated callers and authenticated non-admin roles (Assistant and Supervisor) cannot invoke privileged admin user-management actions or reach the service-role client.
2. **Carry forward:** with one unsettled Case, one settled Case, and a GP record, verify only the unsettled Case moves to the next month, is marked carried forward, and retains the same payment history and remaining balance. Verify settled Case and GP stay in the original cycle.

These tests exercise existing authorization and carry-forward behavior. They do not add product behavior or claim to test Supabase RLS against a live database.

## Files expected to change

- Move all retained `*.test.ts` and `*.test.tsx` files into the categorized `tests/` folders, updating only imports that currently depend on relative test paths.
- Add the two tests described above.
- Update `vitest.config.mts` to discover only the centralized test folders.
- Update `TEST_COVERAGE_REPORT.md` to reflect the resulting suite structure and coverage.

## Acceptance criteria

- No retained test file remains beside production source files.
- Vitest discovers tests only from the centralized test tree.
- Admin authorization regression coverage checks privileged client access is not reached for non-admin roles.
- Carry-forward regression coverage checks selection, destination cycle, carried flag, payments, balance, and unchanged settled/GP records.
- No test run or pass claim is made unless the suite is run and its result is reported.

## Review notes

This design intentionally centralizes files without broad test rewrites or new shared test frameworks. Test names and assertions should remain focused on business outcomes. The current repository has no middleware route guard; authorization coverage will target the existing server-action guard. Database RLS remains a live-database verification concern outside these two unit/integration tests.
