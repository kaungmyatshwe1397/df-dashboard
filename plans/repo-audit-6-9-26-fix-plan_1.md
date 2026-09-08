# DC-FMS (DF Dashboard) — Fix Plan
Based on: Repo Audit, 2026-09-06
Scope: High and Medium severity findings only (Low severity deferred)
Revised: added role checks to Tasks 1 & 2, reordered split-before-error-handling, merged the redundant "unchecked Supabase calls" task into Task 4, added pure-function extraction to the testing task.

## How to use this plan
Tasks are ordered by priority — do them top to bottom. Each fix lists concrete sub-tasks so it can be picked up and worked without re-reading the original audit.

---

## 1. Move `auth.admin` calls out of client code, with strict role checks (High)
**Why first:** these calls are already broken in production — they can never succeed from the browser. But moving them server-side only fixes the "will it run" problem — it doesn't stop any logged-in user from calling the action directly. The service role key bypasses RLS entirely, so the action itself must check who's calling it.

- [x] Create `app/admin/actions.ts` (Server Action file, no `"use client"`)
- [x] In that file, import the server-side Supabase client from `lib/supabase/server.ts` (the one built with the service role key)
- [x] At the top of every action in this file, call `supabase.auth.getUser()` to verify there's an active, valid session — reject immediately if not
- [x] Fetch the caller's profile and assert `role === 'ADMIN'` before doing anything else in the action
- [x] Throw an explicit `Unauthorized` error (and don't proceed) if the caller isn't an admin
- [x] Write `updateUserAction(userId, updates)` — after the checks above, calls `auth.admin.updateUserById`
- [x] Write `deleteUserAction(userId)` — after the checks above, calls `auth.admin.deleteUser`
- [x] Remove the `auth.admin.updateUserById` call at `context/DataContext.tsx:760` — replace with a call to `updateUserAction`
- [x] Remove the `auth.admin.deleteUser` call at `context/DataContext.tsx:776` — replace with a call to `deleteUserAction`
- [x] Confirm `lib/supabase/server.ts` (or wherever the admin client lives) never gets imported into any file marked `"use client"`
- [ ] Manually test: as admin, update a user's password and delete a user — both should succeed. As a non-admin (assistant), attempt to call the same actions directly — both should be rejected with `Unauthorized`

---

## 2. Add server-side route protection in middleware, with role-based access control (High)
**Why:** currently a signed-out user can briefly see protected page content before the client-side redirect kicks in. But session-only checks aren't enough either — a logged-in assistant could still navigate straight to `/admin/*` and hit partial UI or permission errors instead of a clean redirect.

- [x] Open `middleware.ts` — confirm what it currently does (likely only session refresh)
- [x] Add a route matcher for protected paths: `/admin/*`, `/assistant/*` (adjust to match your actual protected routes)
- [x] Inside the middleware, after refreshing the session, check if a session/user exists — if not, redirect to `/login` for any protected route
- [x] Prerequisite: confirm the user's role is already available on the session/JWT. If not, set up a Supabase Auth Hook (Customize Access Token hook) that reads the role from the `profiles` table and adds it to the JWT's `app_metadata` on login/token refresh — this is a one-time setup in the Supabase dashboard plus a small SQL function, done once, not per request
- [x] Extract the user's role for the RBAC check below. Middleware runs on every request, so avoid a database query per request here — read the role from the JWT custom claim set up above, rather than calling the profiles table each time
- [x] Add route gating on top of the session check:
  - If a non-admin session hits `/admin/*`, redirect to `/assistant` (or a 403 page)
  - If an assistant hits an admin-only resource, redirect accordingly
- [x] Update `config.matcher` in `middleware.ts` if needed so middleware actually runs on `/admin` and `/assistant` paths
- [x] Remove or simplify the client-side `useEffect` redirect in `components/layout/PortalLayout.tsx:22-28` — middleware is now the real guard, the client check becomes a fallback rather than the only protection
- [ ] Manually test: (a) signed out, navigate to an admin URL — redirected at the server level, no flash of content; (b) signed in as assistant, navigate to an admin URL — redirected to `/assistant`, not a broken/partial admin page

---

## 3. Add error boundaries and loading states (High)
**Why:** right now, any unhandled error shows a blank screen, and slow loads show nothing — bad experience and hides real problems.

- [x] Create `app/error.tsx` — a client component with `"use client"`, accepts `error` and `reset` props, shows a friendly message and a retry button
- [x] Installed shadcn `spinner` component (`components/ui/spinner.tsx`) for loading states
- [ ] Manually test: temporarily throw an error in a page component to confirm `error.tsx` catches it

---

## 4. Split `DataContext.tsx` into domain-specific contexts (Medium)
**Why, and why before error handling:** at 835 lines with 15+ state variables and 15+ functions, this is hard to test, hard to change safely, and everything re-renders on any change. Doing this before the error-handling pass (next task) means that pass touches the new, smaller files once instead of the 835-line monolith once and then again after the split.

- [ ] Identify the domains currently mixed together: records, payments, financials, users, labs, case types
- [ ] Create `context/RecordsContext.tsx` (or a `useRecords` hook) — move record-related state and functions (`addRecord`, `updateRecord`, `deleteRecord`, etc.)
- [ ] Create `context/PaymentsContext.tsx` — move payment-related state and functions
- [ ] Create `context/FinancialsContext.tsx` — move financial calculation state and functions (including `carryForward`)
- [ ] Create `context/UsersContext.tsx` — move user management state and functions (including the new admin Server Action calls from Task 1)
- [ ] Update components that currently consume `DataContext` to consume the new, narrower context(s) they actually need
- [ ] Remove `DataContext.tsx` once everything is migrated, or keep it as a thin composer if some components genuinely need several domains at once
- [ ] Manually test each area (records, payments, financials, users) still works after the split

---

## 5. Surface errors to the UI instead of `console.error` (Medium)
**Why:** callers of `addRecord`, `updateRecord`, etc. currently have no way to know an operation failed — failures are silent. Do this now, directly in the clean domain contexts from Task 4, rather than in the old monolith.

- [ ] Pick and install a toast library — suggested: `sonner` (lightweight, works well with Next.js App Router) or `react-hot-toast` if you prefer something more established
- [ ] Add the toast provider/container once in the root layout (`app/layout.tsx`)
- [ ] In each new domain context (`RecordsContext`, `PaymentsContext`, `FinancialsContext`, `UsersContext`), update every function that currently only does `console.error` to also return a success/failure result
- [ ] At each call site of those functions (forms, buttons that trigger these actions), check the result and show a toast on failure (and optionally a success toast)
- [ ] Final sweep: audit every remaining `.from().insert()`, `.from().update()`, and `.from().delete()` call across the codebase to confirm the `{ error }` object is captured and handled, not just `data` — this catches anything the context-by-context pass above missed
- [ ] Manually test: force a failure (e.g. temporarily break a query) and confirm a toast appears instead of a silent failure

---

## 6. Add pagination instead of fetching all data upfront (Medium)
**Why:** right now the entire `patient_records`, `case_payments`, `monthly_financials`, `monthly_cycles`, `labs`, `case_types`, and `profiles` tables load into memory on every mount — this gets slower and more expensive as data grows.

- [ ] Identify the current active-cycle logic — the app should default to loading only the current month/cycle's data
- [ ] Update the initial fetch (now living in the split contexts from Task 4) to filter by the active cycle and add `.range()` limits
- [ ] Add a way to fetch other months on demand (e.g. a month picker that triggers a fetch when changed), rather than loading everything at once
- [ ] Consider adopting TanStack Query or SWR for this — it gives you caching, deduplication, and background refetch for free, and directly fixes the old `refreshKey`-triggers-full-reload pattern
- [ ] If adopting a data-fetching library, migrate one context at a time rather than all at once
- [ ] Manually test: confirm switching months loads that month's data without reloading everything else

---

## 7. Add a CI workflow (Medium)
**Why:** without this, broken code (failing lint, failing typecheck, failing tests) can reach production before anyone notices.

- [ ] Create `.github/workflows/ci.yml`
- [ ] Add a job that installs dependencies and runs `npm run lint`
- [ ] Add a step that runs `npm run typecheck` (add this script to `package.json` as `tsc --noEmit` if it doesn't exist yet)
- [ ] Add a step that runs `npm test`
- [ ] Set the workflow to trigger on pull requests and pushes to the main branch
- [ ] Confirm the workflow actually fails the PR check when a test or lint rule is broken (test this with a deliberate throwaway break)

---

## 8. Add tests for core logic, starting with pure functions (Medium)
**Why:** only 6 test files exist for an app with auth, financial calculations, and CRUD — the riskiest logic is currently unverified. Mocking Supabase's chained query builder (`.from().select().eq().single()`) is brittle and slow to write, so pull the actual logic out where it can be tested without a database at all.

- [ ] Extract financial formulas, balance tallying, and carry-forward calculations out of `FinancialsContext` into pure utility functions in `lib/financials.ts` — no Supabase calls inside them, just data in, data out
- [ ] Write fast, database-agnostic unit tests for those pure functions first, covering edge cases: negative values, floating-point rounding, empty cycles
- [ ] Add tests for the remaining context operations (`addRecord`, `addPayment`, `deleteMonth`) — these still need Supabase mocks, but there's now less surface area to mock since the math is already tested separately
- [ ] Add a basic auth flow test (sign in, sign out, protected route access, and the role-gating from Tasks 1 & 2) if not already covered
- [ ] Add mock implementations of the Supabase client in `lib/supabase/__mocks__/` (currently empty) for the tests that do still need one
- [ ] Add edge case tests where relevant: empty data, failed Supabase calls

---

## 9. Add rate limiting / abuse protection on signup (Medium)
**Why:** the public `/signup` page currently has no protection — anyone can create assistant accounts.

- [ ] Decide on an approach: CAPTCHA (e.g. Cloudflare Turnstile, hCaptcha) on the signup form, and/or a server-side rate limit per IP on the signup Server Action/route
- [ ] Implement the chosen protection on `app/signup/page.tsx` and the signup logic (now living in `UsersContext` after Task 4)
- [ ] Consider requiring email verification before an account is fully activated, if not already in place
- [ ] Manually test: confirm repeated rapid signup attempts are blocked or slowed

---

## 10. Remove committed demo credentials (Medium)
**Why:** `admin@test.com` / `admin123` and `assistant@test.com` / `assist123` are visible in `.env.local` comments — a real risk if the repo is ever made public or shared.

- [x] Remove the credential comments from `.env.local:5-7`
- [ ] If these demo accounts are still needed for local development, document them somewhere not committed to version control (a private note, a team password manager, or a `.env.local.example` with placeholder text only)
- [ ] Check git history — if these were ever committed in a prior commit, decide whether the credentials need to be rotated (if the repo has any chance of being public or has been shared outside the immediate team)

---

## Not included (Low severity — deferred)
Security headers, empty `next.config.ts` image config, and other Low-severity items from the audit are intentionally left out of this plan. Revisit them once the above is done.
