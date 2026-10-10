# Mobile Responsive Experience Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement the checklist inline. The user has explicitly requested implementation of the approved spec.

**Goal:** Make reading and entering clinic data comfortable on phones.

**Architecture:** Keep desktop tables and render mobile shadcn Cards from the same paginated data and callbacks below `lg`. Lab reconciliation already stacks its fields, so improve its existing presentation without duplicating editable inputs. Shared dialog and control styling supplies touch spacing and scroll containment.

**Tech Stack:** Next.js App Router, React, Tailwind CSS, shadcn/ui Base UI, Lucide.

**Spec:** `docs/superpowers/specs/2026-10-10-mobile-responsive-design.md`

## Global Constraints

- Preserve data requests, calculations, permissions, validation, and existing desktop workflows.
- Use existing design tokens and shadcn components; new interfaces end in `Type` and new source files have descriptive heading comments.
- Preserve the user's modification to `docs/rules/my-rules.md`: do not commit without an explicit instruction to commit.
- Keep primary workflows free of page-level horizontal scrolling. Desktop tables may scroll within their own container.
- Leave the earlier authentication fix on its own branch/PR; this feature starts from the requested `main` baseline.

## Review Focus

- Long unbroken text and large numbers must wrap in cards without widening the page.
- Payment history controls must operate on the same record through resizing.
- Many pages of records must not create an unbounded pagination strip.
- Saving, failed saves, and read-only lab fields must retain their existing behavior.
- Keyboard-reduced viewport and short landscape screens must keep dialogs scrollable and actions reachable.

## Task 1: Mobile record cards

**Files:** Create `components/records/record-table/mobileRecordCard/{index.tsx,types.ts,paymentList.tsx}`, `components/shared/dataField.tsx`, and `tests/component/MobileRecordCard.test.tsx`; modify `GpTable.tsx`, `CaseTable.tsx`, `record-table/index.tsx`, and `RecordTableHelpers.tsx`.

**Interfaces:** `MobileRecordCard` consumes `PatientRecord`, payment/balance data, controlled history expansion, and optional edit/payment callbacks. All data and callbacks come from the existing table owners. `DataField` presents an accessible label/value pair.

- [x] Test identity, diagnosis, cost/payment labels, carried-forward and settled states, history expansion, edit/payment callbacks, and omitted actions for read-only views.
- [x] Implement cards below `lg` and preserve existing tables at `lg` and above; share current page and expansion state.
- [x] Stack record controls and month selector at narrow widths; provide mobile skeleton cards and bounded pagination with page status.
- [x] Verify focused tests and the existing payment tests.

## Task 2: Patient and admin lists

**Files:** Create `components/patients/registeredPatientsTable/patientCard.tsx`, `components/users/userList/{index.tsx,types.ts}`, and `tests/component/MobilePatientCard.test.tsx`; modify the patient listing, user page, lab and case-type table components.

**Interfaces:** `PatientCard` consumes `PatientType` and `onSelect(patient)`. `UserList` consumes user rows, loading status, and `onEdit(user)`; the page retains fetching and dialogs.

- [x] Test patient identity, missing address, full long values, and selection callback.
- [x] Reuse filtered/paginated patients in mobile cards; stack search/add controls.
- [x] Render mobile user cards and desktop user tables with the same edit callback. Keep lab/case-type tables compact, wrap their names, and label/separate actions.
- [x] Verify selection and existing patient integration coverage.

## Task 3: Reconciliation and mobile forms

**Files:** Modify `PortalLayout.tsx`, `AppSidebar.tsx`, `ui/dialog.tsx`, `app/globals.css`, `tokens.css`, patient registration/record forms, `LabReconciliationTable.tsx`, and `LabFeeInput.tsx`.

**Interfaces:** Preserve every existing form and fee-save signature. Shared dialog styling adapts to the available visual viewport while keeping Base UI focus/close behavior.

- [x] Reduce mobile gutters, allow flexible shell content, and close mobile navigation after selecting a page.
- [x] Introduce token-based mobile touch sizing and scrollable dialogs; stack multi-column form fields on phones and avoid nested mobile form scroll regions.
- [x] Wrap lab group names/totals, prioritize patient identity on mobile, and show the fee field, status, and saving feedback without duplicating inputs.
- [x] Verify existing form/payment/reconciliation tests and add only meaningful interaction coverage where behavior changes.

## Task 4: Verification and review

- [x] Run TypeScript, ESLint, and the affected tests; run the full suite once the focused checks pass.
- [ ] Check rendered layouts at narrow phone, landscape/tablet, and desktop widths with representative long text, currency, loading/empty/error states, and dialog content when browser tooling permits.
- [x] Request a fresh whole-change code review, address material findings, and record verification evidence and remaining limitations.
- [x] Update this plan's checkboxes and spec status. Leave changes uncommitted for user review.

## Verification Evidence and Handoff

- TypeScript and ESLint passed before the final review fixes.
- Focused tests: 5 files / 10 tests passed.
- Full regression suite: 23 files passed, 159 tests passed, 10 skipped.
- Fresh read-only review identified landscape keyboard sizing and clipped long lab filter labels; both are corrected in source. All dialog widths now use the visual viewport height, and lab options wrap within their popup.
- Fee save errors now identify their patient beside the corresponding fee field and preserve the typed value. Added regression tests for failed-save association and read-only inputs; these final additions have not been run.
- The user requested to run the app themselves. No browser or physical-phone validation was completed; the temporary fixture page was removed. Final review fixes were not followed by further test runs.
- At the implementation handoff, changes were left uncommitted and the user-owned change in `docs/rules/my-rules.md` was preserved.
- User subsequently confirmed the final local app run, tests, lint, and type checking passed, and explicitly authorized the implementation commit.

### User Validation TODO

- [x] User confirmed final type checking and lint passed.
- [x] User confirmed final tests passed.
- [ ] Check phone portrait and landscape, especially dialogs with the keyboard open.
- [ ] Confirm full long lab names are readable when choosing the lab filter.
- [ ] Exercise record edit/payment/history, patient search/selection, pagination, and desktop tables.
