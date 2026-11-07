# One-page Case Entry Design and Implementation Plan

**Approved direction:** One-page Case entry matching GP. Lab name, send date, and delivery date can be added later. No patient-ID, registry-status, search, or duplicate-match gate.

**Fields:** Required name, age, gender, record date, case type, positive whole-number cost. Optional address, telephone, teeth, and lab details. Amount paid today starts at zero; remaining balance is calculated live. Existing payment rules remain unchanged.

**UX:** Responsive shadcn patient, treatment, and payment cards. Lab details use a collapsed shadcn panel, expanded automatically when editing saved lab details. Save & back returns to the Case tab. Save & add another clears the entry except record date. Uncertain responses retain the original request and submission ID; retry cannot duplicate receipts.

**Architecture:** A dedicated standalone Case RPC atomically saves the month, case, optional initial receipt, and submission ledger, with no registry writes. Extend the standalone snapshot constraint to Case; keep linked identities and category immutable. New standalone cases can be edited, assigned a lab later, paid, and carried forward by their existing record UUID.

**Approaches:** User selected a direct one-page form over a two-step form to match GP and avoid extra clicks. Optional lab details stay collapsed to keep the initial task focused.

## Constraints

- Local database is production. Prepare migrations and SQL fixtures only; do not execute them.
- Preserve legacy save RPCs and existing linked records. Do not commit without a new request.
- Use existing tokens and shadcn controls; no new dependencies.
- Tests run only after full code/docs implementation. Mocked testing was authorized in this session; exclude production/SQL execution.
- Old/new patient recognition and registration changes remain out of scope.

## Tasks

- [x] Add standalone Case save RPC, mapping, source adapter, and nullable Case identity.
- [x] Replace the Case patient gate with direct entry and optional lab panel.
- [x] Support standalone Case edit, lab assignment/clearing, snapshot filtering, and reconciliation fallback labels.
- [x] Prepare behavior tests for direct save, zero/deposit payments, retry safety, reset, optional lab, and edit.
- [x] Update ERD, flow, UI states, architecture, and rollout documentation.
- [x] Run static checks and the full mocked suite with one worker; review changes independently.

## Verification focus

No registry mutations; no duplicate initial receipts; costs below paid amounts rejected;
lab details can be added/cleared later; snapshots survive reload/filter/edit; GP and
legacy linked workflows retain their contracts. SQL validation/concurrency and mobile
visual QA require disposable staging and remain deferred.

## Results

Full mocked suite: 42 files / 258 tests passed. TypeScript, lint, and whitespace
checks passed. Focused tests exposed an outdated lab placeholder query; it now
selects by its accessible label. Independent read-only review found no material
issues. SQL has not been executed, migration remains unapplied, and no commit was
created. Save & add another resets the lab panel as well as its values.
