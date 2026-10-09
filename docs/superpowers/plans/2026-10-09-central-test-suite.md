# Central Test Suite Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` to implement this plan task by task.

**Goal:** Keep the retained test suite under `tests/`, add essential authorization and carry-forward regression coverage, and keep the report accurate.

**Architecture:** Move tests into `tests/unit`, `tests/component`, and `tests/integration`; use `@/` imports for source modules and narrow Vitest discovery to this tree. Preserve existing test behavior, adding two focused integration tests for the approved business risks.

**Tech Stack:** Vitest, React Testing Library, TypeScript, Next.js, Supabase client mocks.

**Spec:** `docs/superpowers/specs/2026-10-09-central-test-suite-design.md`

## Global Constraints

- Keep tests focused on money, patient identity, state changes, and authorization.
- Do not claim live Supabase RLS is covered by unit tests.
- Keep `test-setup.ts` at the project root.
- Discover tests only in `tests/**/*.test.{ts,tsx}`.

## Review Focus

- Non-admin authenticated roles and unauthenticated callers must be denied before service-role access.
- Carry-forward must not move settled Case or GP records.
- Carry-forward must preserve linked payments and outstanding balance.
- Moving tests must not leave relative imports pointing at old test locations.
- Vitest must not discover package tests inside `node_modules`.

---

### Task 1: Centralize the Existing Test Files

**Files:**
- Move all 18 retained test files into `tests/unit`, `tests/component`, or `tests/integration` based on their scope.
- Modify: `vitest.config.mts`
- Preserve: `test-setup.ts`

**Interfaces:**
- Source imports use the existing `@/` alias.
- Vitest test setup remains `./test-setup.ts`.

- [x] Move pure helper/schema/mapping/formula tests to `tests/unit/` and update source imports to aliases.
- [x] Move rendered component tests to `tests/component/` and update source imports to aliases.
- [x] Move DataContext, hook, service, and server-action tests to `tests/integration/` and update source imports to aliases.
- [x] Change Vitest `include` to `tests/**/*.test.{ts,tsx}`.
- [x] Confirm source-tree inventory contains no retained test files outside `tests/` and test discovery excludes `node_modules`.

### Task 2: Add Essential Authorization and Carry-Forward Tests

**Files:**
- Create: `tests/integration/admin-authorization.test.ts`
- Create: `tests/integration/carry-forward.test.tsx`
- Modify: `TEST_COVERAGE_REPORT.md`

**Interfaces:**
- Admin actions: `createUserAction`, `updateUserRoleAction`, and `deleteUserAction` from `@/app/admin/actions`.
- Data flow: `DataProvider` and `useData` from `@/context/DataContext`; `carryForward()` returns `{ carriedCount: number }`.

- [x] Add an admin action test proving no authenticated session is rejected before service-role access.
- [x] Add a parameterized admin action test proving `ASSISTANT` and `SUPERVISOR` callers are rejected before service-role access.
- [x] Add a carry-forward test with unsettled Case, settled Case, and GP fixtures; assert only the unsettled Case moves, gets the next month and carry-forward flag, retains its payment list and balance, and the other two remain in the original month.
- [x] Run the focused new tests and confirm they pass against the existing behavior (4 tests passed).
- [x] Update the report with the final centralized inventory, added coverage, and any remaining limitations.
- [x] Run the full Vitest suite to check that relocation preserved coverage (152 passed, 10 skipped, 162 total).

## Review outcomes

- The carry-forward test additionally selects October and confirms the carried record references the actual October cycle.
- Updated `docs/rules/testing-guide-rules.md` to match centralized discovery. The reviewer marked this Minor, but it was treated as Important because the old guidance would create tests that Vitest silently excludes.

## Handoff

Review this plan and choose native execution in this session. The tasks are tightly coupled through test imports and Vitest discovery; implementing them together keeps the move reviewable and avoids parallel edits to shared paths.
