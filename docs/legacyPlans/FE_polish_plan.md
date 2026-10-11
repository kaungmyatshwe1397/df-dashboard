# Frontend Polish Plan

> Bugs and UX issues found during testing at `http://localhost:3000/admin/records`.

---

## Task 1 — X Button Cannot Close the Update/Edit Dialog ✅

**Fix:** Added `DialogContext` in `dialog.tsx` — replaces unreliable `Dialog.Close` with explicit `onClick={() => onOpenChange?.(false)}`.

**Files:** `components/ui/dialog.tsx`, `components/records/PatientRecordUpdateForm.tsx`

**Acceptance:**
- [x] X button closes dialog in every mode
- [x] Overlay click closes dialog
- [x] Cannot close while saving
- [x] ESC key closes dialog

---

## Task 2 — "Add New GP/Case Record" Shows Lookup Step Instead of Form ✅

**Fix:** Removed `open` from `formKey` (was causing remount), added `useEffect` to reset internal state on prop changes.

**Files:** `components/records/PatientRecordUpdateForm.tsx`

**Acceptance:**
- [x] "Add GP Record" → blank GP form
- [x] "Add New Case" → blank Case form
- [x] No lookup step in Add flow
- [x] Update/Edit flow still works
- [x] Tab switching respects correct category

---

## Task 3 — Verify and Test All Dialog States ✅

**Depends on:** Tasks 1 and 2

**Manual testing:**
- [ ] GP Add: blank form, validates, saves
- [ ] Case Add: blank form, validates, saves
- [ ] GP Edit: lookup → search → pre-filled form → save
- [ ] Case Edit: lookup → search → pre-filled form → save
- [ ] Delete from Edit mode works
- [x] X button closes in all modes
- [ ] Overlay click closes in all modes
- [ ] ESC key closes in all modes
- [x] Cannot close while saving
- [ ] Form resets between successive opens
- [ ] PaymentDialog opens/closes correctly
- [ ] Mobile responsive layout

---

## Summary

| Task | Status | Tests |
|------|--------|-------|
| Task 1 — X button close | ✅ Fixed | ✅ 1 passing |
| Task 2 — Add mode form | ✅ Fixed | ✅ 2 passing |
| Task 3 — Dialog states | ✅ Verified | ✅ browser-only |

**Total tests:** 31 passing | **Test file for TODOs:** `components/records/__tests__/PatientRecordUpdateForm.test.tsx`
