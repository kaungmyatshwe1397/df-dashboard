# Mobile Responsive Experience Design

**Status:** Proposed design for user review  
**Branch:** `mobile-repsonsive`

## Goal

Make the clinic dashboard comfortable to read and operate on phones while preserving its current desktop workflows, data behavior, and role-based access.

## User Need

Staff may sign in from a phone to look up patients, review records, enter or edit information, record payments, and reconcile lab fees. Existing dense tables are difficult to scan and interact with on narrow screens, especially when important columns or input controls extend beyond the viewport.

## Chosen Direction: Hybrid Layout

Use mobile cards for data-dense, frequently used views where users need to inspect several fields or take an action. Keep compact tables where their few columns remain readable on a phone. Preserve the current desktop table layouts.

This avoids relying on sideways scrolling for primary workflows while preventing simple configuration lists from becoming unnecessarily tall.

## Scope

### In scope

- Assistant and admin GP and Case record lists.
- Registered patient search and list.
- Admin lab reconciliation, including lab filtering, fee entry, save feedback, and fee totals.
- Compact admin lists for labs, case types, and users.
- Shared portal shell, page spacing, navigation, tabs, filters, pagination, dialogs, and data-entry forms where needed for phone use.
- Existing loading, empty, error, permission, and interaction states at narrow widths.

### Out of scope

- Changes to database schema, queries, calculations, or business rules.
- Changes to role permissions or the financial information each role can see.
- A new native app, offline mode, or a tablet-specific redesign.
- Redesigning desktop page layouts beyond fixing regressions caused by the responsive work.

## Responsive Behavior

### Record lists: GP and Case

- Keep existing tables at desktop widths.
- At phone widths, render one card per record with a consistent hierarchy: patient name and ID first, then date, diagnosis, and category-specific details.
- GP cards retain the same per-record fields currently available to that role.
- Case cards show treatment and payment details that the current role is permitted to view. Keep payment history and less frequently needed details discoverable without making the primary card difficult to scan.
- Keep existing add, edit, payment, expand/collapse, status, carried-forward, and pagination behavior. Make controls easy to reach and tap.
- Do not expose aggregate financial totals or lab fees to assistants. Preserve the existing PRD role boundaries for every card state.

### Registered patients

- Keep the desktop table.
- At phone widths, show patient entries as selectable cards. Put patient name and patient ID first; show registration date and address as supporting details.
- Preserve patient-ID search, live result count, row selection/navigation, add-patient permission behavior, and pagination.
- Long values wrap or are otherwise fully accessible; empty details use the existing clear missing-value treatment.

### Lab reconciliation

- Keep the current grouped desktop layout.
- At phone widths, render each case in a compact card within its lab group. Show patient and case context before the lab-fee input, with the current fee and payment status easy to identify.
- Keep the lab filter, group totals, save-on-blur/Enter behavior, saving state, validation, and error feedback.
- Keep each input and its feedback associated with the correct case. Do not silently discard an edited value after a failed save.

### Compact admin lists

- Keep desktop tables for users, labs, and case types.
- Keep the two-column lab and case-type lists compact if they fit at phone widths; otherwise use a simple stacked list with the same edit/delete actions.
- Present user rows as compact stacked items on phones if the existing columns do not fit without cramped text or page-level horizontal scrolling.
- Preserve action permissions, confirmation dialogs, and current empty/loading/error behavior.

### Navigation, forms, and shared layout

- Keep the existing role-specific navigation and mobile sidebar interaction. Ensure the active page and account actions remain reachable on narrow screens.
- Reduce page gutters and stack headers, controls, filters, and pagination when needed to prevent overflow.
- Make dialogs and long forms usable at phone widths: fields stack, content can scroll, the active field remains visible when the on-screen keyboard opens, and primary actions remain reachable.
- Keep the existing shadcn/ui components and design tokens. Follow the project's current responsive breakpoints and spacing/color/typography tokens; do not introduce one-off hardcoded styling values.

## Interaction and Content Rules

- Preserve desktop functionality and role-based visibility.
- Prioritize the identity and action context for each item; avoid hiding key information behind an interaction when it is needed to safely perform the primary task.
- Keep actions visually distinct and sufficiently separated to reduce accidental taps, especially edit, payment, and delete actions.
- Long names, diagnoses, addresses, and lab names must not overlap controls or force the page wider than the viewport. Users must still be able to access full values.
- Currency and dates retain current formatting. Large amounts remain readable and associated with their labels.
- Loading, empty, error, and no-search-results states must use the same responsive containers as the ideal state.

## Edge Cases

- Narrow phone viewport, browser zoom, and orientation changes.
- On-screen keyboard opening while searching or editing a fee/form field.
- Long or absent names, diagnoses, addresses, and lab names.
- Large currency values, zero values, and negative/remaining balances where currently valid.
- Case records with payment history, carried-forward state, or completed payment status.
- Many records and long card lists; pagination/search controls remain reachable.
- Save-in-progress and save-failure states for lab fees and forms.
- Empty data, loading, error, and no-match states.
- Assistant/admin/supervisor role differences; no role gains access to fields or actions they cannot currently use.

## Acceptance Criteria

1. At phone widths, primary record, registered-patient, and lab-reconciliation workflows do not require page-level horizontal scrolling.
2. Users can identify a record and reach the relevant existing add, edit, payment, or fee-entry action from its mobile presentation.
3. GP and Case lists preserve pagination and all current record data and actions.
4. Registered-patient search, result count, selection, add permission, and pagination continue to work.
5. Lab-fee entry retains its save behavior, visible saving/error feedback, group filter, and totals.
6. Compact admin lists remain usable without clipped action controls or forced page overflow.
7. Long text, missing values, large amounts, zero amounts, and the on-screen keyboard do not break the layout or obscure the active control.
8. Assistant, admin, and supervisor users see only the same data and actions they are allowed to see today.
9. Existing desktop layouts remain functionally and visually equivalent.
10. Existing loading, empty, error, and edge states remain understandable and actionable on mobile.

## Test Checklist To Carry Into the Implementation Plan

- [ ] Component test: mobile record presentation retains existing permitted fields and record actions for GP and Case entries.
- [ ] Component test: record actions and pagination continue to operate in the mobile presentation.
- [ ] Component test: registered-patient search, no-match state, selection, add permission, and pagination work with the mobile presentation.
- [ ] Component test: lab-fee save, saving state, validation/error feedback, filter, and totals remain associated with the correct case.
- [ ] Component test: assistant/supervisor views do not expose admin-only fee or aggregate data or actions.
- [ ] Manual responsive review: narrow phone widths, orientation change, zoom, keyboard open, long text, large currency values, and empty/loading/error states.
- [ ] Regression review: desktop tables and existing role-specific flows remain intact.

## Design Notes and Risks

- Card layouts use more vertical space than tables. Search, filters, result counts, and pagination must remain easy to reach on long lists.
- Case cards can become dense if every field and payment detail is expanded at once. The implementation plan should specify which secondary details can be disclosed while keeping primary context and safe actions visible.
- The existing PRD and UI-state checklist describe role access in slightly different language around financial values. Implementation must preserve current application behavior and enforce the stricter rule that assistants never see aggregate financial totals or lab fees; the change must not broaden access.
- The repository's documented design files are located under `docs/lib/` and `docs/diagram/`, rather than the paths in the supplied AGENTS.md table. The implementation should follow the files currently present and the existing shadcn/Tailwind patterns.
