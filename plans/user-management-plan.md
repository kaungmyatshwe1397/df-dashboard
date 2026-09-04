# DC-FMS User Management Plan

> **Status:** Ready for Implementation
> **Reference:** `prd.md` · `dc-fms-erd.mmd` · `backend-draft-plan.md`
> **Frontend:** Build UI with mock state first; Supabase integration replaces mocks later.
> **Depends On:** Frontend Tasks 1–10 (all complete)

---

## Context

Currently, users are hardcoded in `lib/mock-data.ts`:
- `admin` / `admin123` (ADMIN role)
- `assistant` / `assist123` (ASSISTANT role)

No signup, no password change, no user deletion. This plan adds user management UI for both roles before Supabase connection.

---

## U-1 — Admin: User Management Page

**Title:** Build admin page to view, edit, and delete user accounts

**Expected Outcome:** An admin-only page at `/admin/users` showing all registered users in a table. Admin can edit username/password for any user and delete assistant accounts.

**Things To Do:**

### 1.1 Add `users` state to DataContext
- Add `users: User[]` to `DataContextType` interface
- Initialize from `MOCK_USERS` (deep copy, not reference)
- Add operations:
  - `updateUser(id, updates: { username?: string; password?: string })` — patches user in state
  - `deleteUser(id)` — removes user from state; block if deleting self
  - `addUser(user: { username: string; password: string; role: UserRole })` — appends to state (used by assistant signup, U-2)
- Expose `users` from provider

### 1.2 Create User Management Table
- Create `components/users/UserTable.tsx`
- Columns: Username, Role (Badge), Actions (Edit, Delete)
- Role badge: ADMIN = default variant, ASSISTANT = secondary variant
- Delete button: hidden for ADMIN role rows (prevent self-deletion or admin deletion)
- Delete button: show confirmation dialog before delete
- Edit button: opens edit dialog

### 1.3 Create User Edit Dialog
- Create `components/users/UserEditDialog.tsx`
- Fields: Username (text input), New Password (optional, text input with show/hide toggle)
- If password field is left blank, password is not changed
- Validation: username required, min 3 characters; password min 6 characters if provided
- On save: call `updateUser(id, { username, password })` from DataContext
- Show inline error if username already taken (by another user)

### 1.4 Create User Delete Confirmation Dialog
- Create `components/users/UserDeleteDialog.tsx`
- Confirmation prompt: "Delete account for {username}? This cannot be undone."
- Destructive Button to confirm
- On confirm: call `deleteUser(id)` from DataContext
- Block deletion if target user is the currently logged-in user

### 1.5 Create Admin Users Page
- Create `app/admin/users/page.tsx`
- Use `PortalLayout requiredRole="ADMIN"`
- Render `UserTable` with all users from DataContext
- Add "User Management" nav item to `adminNavItems` in `AppSidebar.tsx` with `Users` icon

### 1.6 Extract shared form components
- Create `components/shared/PasswordField.tsx` — reusable password input with show/hide toggle
- Reuse in: UserEditDialog, Login page, Assistant signup (U-2)

**Files to create:**
- `components/users/UserTable.tsx`
- `components/users/UserEditDialog.tsx`
- `components/users/UserDeleteDialog.tsx`
- `components/shared/PasswordField.tsx`
- `app/admin/users/page.tsx`

**Files to modify:**
- `context/DataContext.tsx` — add `users` state, `updateUser`, `deleteUser`, `addUser`
- `components/layout/AppSidebar.tsx` — add "Users" nav item to admin
- `app/login/page.tsx` — use shared `PasswordField`

**UI States:** Loading (Skeleton table rows), Error (Alert with retry), Empty (no users — shouldn't happen), Edge case (long usernames truncate, prevent self-delete)

---

## U-2 — Assistant: Sign Up Page

**Title:** Build a signup page for assistants to create their own account

**Expected Outcome:** A public signup page at `/signup` where a new assistant can register with username and password. Account is created with ASSISTANT role.

**Things To Do:**

### 2.1 Create Signup Form
- Create `app/signup/page.tsx`
- Fields: Username (text), Password (PasswordField component from U-1), Confirm Password (PasswordField)
- Validation:
  - Username required, min 3 characters, alphanumeric + underscores only
  - Password required, min 6 characters
  - Confirm Password must match Password
- On submit: call `addUser({ username, password, role: UserRole.ASSISTANT })` from DataContext
- On success: redirect to `/login` with success message
- On failure (username taken): show inline error Alert

### 2.2 Add Signup Link to Login Page
- Add "Don't have an account? Sign up" link at bottom of login form
- Link navigates to `/signup`

### 2.3 Add Login Link to Signup Page
- Add "Already have an account? Log in" link at bottom of signup form
- Link navigates to `/login`

**Files to create:**
- `app/signup/page.tsx`

**Files to modify:**
- `app/login/page.tsx` — add signup link

**UI States:** Ideal (form ready), Loading (spinner on submit button), Error (inline Alert for validation or username taken), Edge case (password mismatch, long input)

---

## U-3 — Admin: Change Own Password

**Title:** Add password change capability to admin profile

**Expected Outcome:** Admin can change their own password from the sidebar user info area or from the user management page.

**Things To Do:**

### 3.1 Add password change to sidebar
- In `AppSidebar.tsx`, add a "Change Password" option next to the logout button (or as a dropdown menu item)
- Opens a `PasswordChangeDialog`

### 3.2 Create Password Change Dialog
- Create `components/users/PasswordChangeDialog.tsx`
- Fields: Current Password (PasswordField), New Password (PasswordField), Confirm New Password (PasswordField)
- Validation:
  - Current password must match logged-in user's password
  - New password min 6 characters
  - Confirm must match new password
  - New password must differ from current password
- On save: call `updateUser(currentUser.id, { password: newPassword })` from DataContext
- Show success message after save

**Files to create:**
- `components/users/PasswordChangeDialog.tsx`

**Files to modify:**
- `components/layout/AppSidebar.tsx` — add password change trigger

**UI States:** Ideal (dialog closed), Open (form ready), Loading (spinner on save), Error (inline validation), Success (brief success message)

---

## Dependency Graph

```
U-1 (Admin User Management)
  ├→ U-2 (Assistant Signup) — reuses PasswordField, addUser from DataContext
  └→ U-3 (Admin Change Password) — reuses PasswordField, updateUser from DataContext
```

U-1 must be done first since U-2 and U-3 depend on the DataContext operations it introduces.

---

## Task Summary

| # | Task | Page/Component | Role | Priority |
|---|------|----------------|------|----------|
| U-1 | Admin User Management | `/admin/users` | Admin | Required |
| U-2 | Assistant Signup | `/signup` | Assistant | Required |
| U-3 | Admin Change Password | Sidebar dialog | Admin | Required |

---

## Mock Data Strategy

All user operations use React context state initialized from `MOCK_USERS`. This makes it trivial to swap with Supabase Auth later:

| Mock Operation | Supabase Replacement |
|---|---|
| `addUser()` | `supabase.auth.signUp()` + `insert` into `users` table |
| `updateUser()` | `supabase.auth.updateUser()` + `update` on `users` table |
| `deleteUser()` | `supabase.auth.admin.deleteUser()` + `delete` from `users` table |
| `authenticateUser()` | `supabase.auth.signInWithPassword()` |
| `users` state read | `supabase.from('users').select('*')` |

---

## RLS Considerations (for Supabase phase)

- Only ADMIN can read the full `users` table
- ASSISTANT can only read their own user row
- Only ADMIN can delete users
- Only ADMIN can change a user's role
- Users can update their own password (current password verification handled client-side or via Supabase `updateUser`)
- Signup creates a row in `users` table with ASSISTANT role (RLS policy: `INSERT` allowed for unauthenticated, role must be ASSISTANT)

---

## Files Changed Summary

| File | Action | Task |
|---|---|---|
| `context/DataContext.tsx` | Modify — add users state + CRUD | U-1 |
| `components/layout/AppSidebar.tsx` | Modify — add Users nav + password change | U-1, U-3 |
| `app/login/page.tsx` | Modify — add signup link + use PasswordField | U-2 |
| `components/shared/PasswordField.tsx` | Create | U-1 |
| `components/users/UserTable.tsx` | Create | U-1 |
| `components/users/UserEditDialog.tsx` | Create | U-1 |
| `components/users/UserDeleteDialog.tsx` | Create | U-1 |
| `app/admin/users/page.tsx` | Create | U-1 |
| `app/signup/page.tsx` | Create | U-2 |
| `components/users/PasswordChangeDialog.tsx` | Create | U-3 |
