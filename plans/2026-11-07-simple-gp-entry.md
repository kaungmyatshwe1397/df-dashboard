# Simple GP Entry Implementation Plan

**Goal:** Add GP visits directly with name, age, gender, optional address, date, treatment, and cost. Registration remains separate; old/new patient identification is deferred.

**Architecture:** GP visits store their own demographics with no required registry link. A dedicated retry-safe RPC saves the visit and month atomically, without inserting or updating patients. Existing linked visits and Case saves retain their contracts.

**Tech stack:** Existing Next.js App Router, React, shadcn, Tailwind tokens, Supabase PostgreSQL.

**Spec:** User-approved discussion in this session: direct GP entry, four demographic fields, no patient selection or registration requirement.

## Constraints and decisions

- The local app uses production data. Prepare SQL only; never apply it in this task.
- No commits. Work on the existing `patient_record_update` branch.
- Follow `docs/rules/my-rules.md`: implement code/docs and prepare tests first; request permission before running tests.
- Keep Case and registration workflows intact. No automatic name matching.
- Allow null patient UUID only for GP; retain existing linked identity protections.
- New GP visits have no registration status. Preserve snapshot demographics through loading, filtering, and editing.
- Keep the same submission ID and values after an uncertain response; disable edits until retry succeeds.

## Tasks

- [x] Add standalone GP source/types, database migration, and RPC adapter; retain legacy saves.
- [x] Add direct GP form using four patient fields and existing treatment/date controls; keep Case UI intact.
- [x] Support standalone GP demographics in mapping, monthly filtering, visit selection, and editing.
- [x] Prepare component/service/filter tests, preserving existing Case coverage.
- [x] Update ERD, flow, UI-state checklist, and rollout documentation.
- [x] Review diff and run static checks.
- [x] Request permission and run mocked tests.

## Review focus / verification

- Empty/invalid names, ages, dates, and costs are rejected on both client and server.
- Same-name visits save without registry matching or creating patient profiles.
- Save-and-add-another clears demographics/treatment and preserves date, using a fresh submission ID.
- Failed saves preserve the complete immutable request for safe retry.
- Unlinked records remain searchable/editable and never appear as unregistered profiles.
- Verify `npm run typecheck`, `npm run lint`, and `git diff --check` locally; mocked Vitest tests after approval. SQL verification requires a disposable database and separate approval.

## Execution notes

Context7 is unavailable. Reviewed installed Next.js 16.3.3 App Router navigation docs, React controlled-input documentation, and Supabase RPC documentation. Existing APIs remain suitable; no package changes required.

Static verification: `npm run typecheck`, `npm run lint`, and `git diff --check` pass.
Independent read-only code review found no remaining material issues. SQL has not
been executed. The database migrations remain unapplied. No commits were created.

## Follow-up: contact and edit layout

- Optional telephone belongs to the visit; prepare a separate follow-up migration.
- GP add/edit share record-only fields, including linked older GP visits. Preserve
  clinical-history values when editing only basic linked demographics.
- Use a wider edit dialog and two responsive cards, with visible Delete/Cancel/Save.
- User approved the mocked test run while requesting this follow-up; run after the
  complete implementation. Production database operations remain excluded.

Follow-up verification: all 41 test files / 257 tests passed with one worker;
TypeScript, lint, and whitespace checks passed. The initial parallel focused run
timed out on the existing Case retry test; serial reruns passed. Browser visual QA
and SQL execution remain deferred to an isolated staging environment.
