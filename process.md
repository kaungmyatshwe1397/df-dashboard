# Process: Patient Record Form — Add New Case / Add GP Record Bug

## Issue

When clicking **"Add New Case"** or **"Add GP Record"** in the patient record table, only the description line *"Fill in the details to add a new patient record."* is displayed. The form fields (Patient ID, Patient Name, Diagnosis, etc.) do not appear.

## Root Cause

`PatientRecordUpdateForm` is **always mounted** in the page — it is not conditionally rendered. The `useState` initializers run only **once** on first mount.

```
// On first mount: isAdding=false, editRecord=null
const [form, setForm] = useState(() => {
  if (editRecord) return getInitialForm(editRecord);  // skipped
  if (isAdding) { return { patientId: "", ... }; }    // skipped
  return null;  // ← form is initialized as null
});
```

When the user later clicks "Add New Case":
- Parent sets `isAdding=true` and `open=true`
- `PatientRecordUpdateForm` re-renders with new props
- **But `useState` does not re-run its initializer** — `form` stays `null`

### Why the `key` trick on `DialogContent` doesn't work

```
<DialogContent key={formKey} ...>
```

This only remounts the `DialogContent` subtree. The `useState` hooks (`form`, `lookupId`, `foundRecord`, etc.) are declared in the **parent** `PatientRecordUpdateForm` component, which never unmounts. So the state is never reset.

## The Rendering Flow

```
PatientRecordUpdateForm (always mounted)
  └── DialogContent (key={formKey} — remounts on key change)
        ├── DialogHeader → shows description ✅
        └── Conditional rendering:
            ├── isLookupMode && !foundRecord → lookup step
            └── form ? → form step  ← form is null, so nothing renders ❌
```

## Solution

Use a `useEffect` that resets all state when the dialog opens with changed props (`isAdding`, `editRecord`, `open`). The `useEffect` must be placed **after all `useState` declarations** to avoid lint errors about accessing variables before they are declared.

```tsx
// Must be after all useState declarations
useEffect(() => {
  if (!open) return;

  if (isAdding) {
    setForm({ patientId: "", patientName: "", ... });
    setFoundRecord(null);
    setLookupId("");
    setLookupError(null);
    setErrors({});
    setSubmitError(null);
  } else if (editRecord) {
    setForm(getInitialForm(editRecord));
    setFoundRecord(editRecord);
    setLookupId("");
    setLookupError(null);
    setErrors({});
    setSubmitError(null);
  } else {
    // Lookup mode — reset everything
    setForm(null);
    setFoundRecord(null);
    setLookupId("");
    setLookupError(null);
    setErrors({});
    setSubmitError(null);
  }
}, [open, isAdding, editRecord]);
```

### Also remove

- `key={formKey}` from `DialogContent` — no longer needed
- The `formKey` useMemo — no longer needed

### Why `useEffect` works here

Unlike `useState` initializers, `useEffect` runs **every time its dependencies change**. So when `open` goes from `false` to `true` and `isAdding` is `true`, the effect fires and resets all state to the correct values for add mode.

## Files Involved

| File | Role |
|------|------|
| `components/records/PatientRecordUpdateForm.tsx` | The dialog — contains the buggy state initialization |
| `app/admin/records/page.tsx` | Passes `isAdding` prop to the form |
| `app/assistant/page.tsx` | Passes `isAdding` prop to the form |
