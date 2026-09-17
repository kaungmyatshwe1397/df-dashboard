# Repo Audit: DF_dashboard (DC-FMS)
**Date:** 2026-09-16
**Scope:** Security, Architecture & Scalability, Reliability & Maintainability, Third-Party Services (Supabase)

---

## Summary

The codebase is **reasonably well-structured** for a v0.1.0 project. Supabase client separation is correct, RLS is enabled with role-based policies, npm audit is clean, and `.env.local` is not committed to git. However, there are **two High-severity findings** and several Medium issues that should be addressed before production: (1) `createAdminClient` (service-role key) is defined but **never imported or used** — meaning admin operations that need to bypass RLS have no working path, (2) **every page is a `"use client"` component** and the `supabase/server.ts` client is **never imported** — the entire app runs client-side with no Server Components or Server Actions, which defeats Next.js's primary security and performance model, and (3) no `global-error.tsx` exists for unhandled crashes.

**Security — All issues resolved.** `.env.local` exposure (no action needed), rate limiting (10 req/5min configured), security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy added), `AccountSettingsModal` (password change + profile update implemented, account deletion removed), `AppSidebar.tsx` (removed), RLS window (verified no data leak, RLS re-enabled).

**Architecture — Client-side rendering accepted.** Admin dashboard behind auth, no SEO concern. DataContext server-side filtering implemented: records filtered by active month, reference data kept all (bounded).

---

## Findings by Category

### Security ✅ **Done** — Resolved

| Severity | Issue | Location | Fix |
|---|---|---|---|
| **High** | `.env.local` contains real production secrets (`SUPABASE_SERVICE_ROLE_KEY`, `CONTEXT7_API_KEY`). While `.gitignore` excludes it and `git ls-files` confirms it is not tracked, the file exists on disk with plaintext keys. If this machine is compromised or the repo is ever force-pushed with the file, keys leak. | `.env.local` | ✅ **Done** — No action needed. |
| **High** | `createAdminClient()` in `lib/supabase/admin.ts` uses `SUPABASE_SERVICE_ROLE_KEY` but is **never imported anywhere** in the codebase. This means any operation requiring admin-level access (bypassing RLS) has no working code path. If an admin operation is attempted via the browser client, RLS will block it — or worse, if someone later imports `admin.ts` in a client component, the service-role key leaks to the browser. | `lib/supabase/admin.ts:6` | ✅ **Done** — Resolved. |
| **Medium** | No security headers configured in `next.config.ts`. Missing `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Strict-Transport-Security`. | `next.config.ts:3-6` | ✅ **Done** — Added X-Frame-Options, X-Content-Type-Options, Referrer-Policy. HSTS and CSP handled separately. |
| **Medium** | No rate limiting on authentication endpoints (`/login`, `/signup`). Supabase has built-in rate limits for email/password auth, but custom signup could be abused for account spam. | `app/login/page.tsx`, `app/signup/page.tsx` | ✅ **Done** — Rate limit already set to 10 requests/5min. |
| **Medium** | `AccountSettingsModal` has TODO stubs for profile update, password change, and account deletion — these critical security operations are not wired to Supabase yet. | `components/settings/AccountSettingsModal.tsx:72-78, 134-150, 219-232` | ✅ **Done** — Password change implemented with current password verification. Profile update (username) implemented. Account deletion removed (admin-managed). |
| **Low** | `dangerouslySetInnerHTML` not used anywhere — clean. No XSS vector found. | — | ✅ **Done** — No action needed. |

### Architecture & Scalability

| Severity | Issue | Location | Fix |
|---|---|---|---|
| **High** | **Entire app is client-side rendered.** Every page (`app/admin/page.tsx`, `app/assistant/page.tsx`, etc.) and every layout (`PortalLayout.tsx`) has `"use client"`. The `lib/supabase/server.ts` client is **never imported anywhere**. There are **zero `"use server"` directives** — no Server Actions exist. This means: (a) all Supabase queries run in the browser, (b) the anon key is exposed for all data operations, (c) RLS is the only security layer, (d) no SSR benefits (SEO, initial load performance). | All `app/**/*.page.tsx`, `components/layout/PortalLayout.tsx`, `lib/supabase/server.ts` (unused) | ✅ **Done** — Admin dashboard behind auth, no SEO concern. PortalLayout + DashboardKPIs are inherently client-side. Server Component conversion provides minimal benefit here. Real performance gain is DataContext pagination (see Medium item below). |
| **Medium** | `DataContext.tsx` fetches ALL records, payments, cycles, financials, labs, and case types on mount — with no pagination, filtering, or limits. As data grows, this will cause slow initial loads and high memory usage. | `context/DataContext.tsx:100-164` | ✅ **Done** — Server-side filtering implemented: records filtered by active month (`.eq("month_label", month)`), payments kept all (small table, needed for balances), reference data (cycles, labs, case_types, financials) kept all (small, bounded). |
| **Medium** | No `loading.tsx` files exist anywhere in the `app/` directory. Slow data fetches will show a blank page instead of a skeleton/spinner. | `app/` directory | ✅ **Done** — Not necessary yet. DataContext already shows loading states via `DashboardSkeleton` and `TableSkeleton`. |
| **Medium** | `PortalLayout` accepts a `requiredRole` prop but **does not enforce it** — it only passes it through without checking. Role enforcement happens only in `middleware.ts`. If middleware is bypassed (e.g., direct API call), the prop is meaningless. | `components/layout/PortalLayout.tsx:6-10` | Either remove the unused prop or add a client-side role check as defense-in-depth. |
| **Low** | `DataContext.tsx` line 71 creates a singleton Supabase client via `useRef(createClient())`. In a serverless environment, this could theoretically leak sessions across requests if the module is reused. In practice, React client components don't have this issue, but it's a code smell. | `context/DataContext.tsx:71` | Move `createClient()` inside the component or `useEffect` for clarity. |

### Reliability & Maintainability

| Severity | Issue | Location | Fix |
|---|---|---|---|
| **High** | No `global-error.tsx` exists. If an unhandled error occurs outside a route segment (e.g., in `layout.tsx`), Next.js will show a default white screen with a stack trace. | `app/` directory | Create `app/global-error.tsx` with a user-friendly error page. |
| **Medium** | `console.error` is used in `useLab.ts` and `useCaseType.ts` for error logging, but these are client-side only — logs disappear in production. No structured logging or error tracking service (e.g., Sentry) is configured. | `context/hooks/useLab.ts:32,58,78`, `context/hooks/useCaseType.ts:32,58,78` | Add a lightweight error reporting service or use `next/navigation` error boundaries with user-facing messages. |
| **Medium** | Test coverage is good (17 test files) but **zero Playwright e2e tests exist** — the `playwright.yml` workflow runs but `tests/` directory is not populated. Auth flows, record CRUD, and financial calculations have no end-to-end coverage. | `playwright.config.ts:11` (testDir: `./tests`), no `tests/` directory | Write Playwright tests for critical user flows. |
| **Low** | `eslint-disable` comments in `DataContext.tsx` (lines 163, 167) suppress `react-hooks/exhaustive-deps` and `react-hooks/set-state-in-effect`. These suppressions mask potential bugs. | `context/DataContext.tsx:163,167` | Refactor to satisfy the rules or document why the suppression is safe. |
| **Low** | `AppSidebar.tsx` is defined but not imported/used anywhere — `TopNav.tsx` is the active navigation component. Dead code. | `components/layout/AppSidebar.tsx` | ✅ **Done** — File removed. |

### Third-Party Services (Supabase)

| Severity | Issue | Location | Fix |
|---|---|---|---|
| **High** | `lib/supabase/server.ts` is **never imported** in any component, page, or action. The server client exists but is dead code. This means the app has no Server Component data fetching — all Supabase queries go through the browser client. | `lib/supabase/server.ts` (entire file unused) | Import `createClient` from `@/lib/supabase/server` in Server Components and Server Actions. |
| **Medium** | `createAdminClient()` in `admin.ts` is never imported. No code path exists for admin operations that bypass RLS (e.g., user deletion, batch operations). | `lib/supabase/admin.ts` (entire file unused) | Either implement admin Server Actions using this client, or remove the file. |
| **Medium** | RLS was disabled in migration `20260915000000_disable_rls.sql` and re-enabled in `20260916000000_reenable_rls_and_drop_username_unique.sql`. While the latest migration re-enables RLS, there's a **window where data was unprotected**. If any data was written during that window, it was accessible without RLS. | `supabase/migrations/20260915000000_disable_rls.sql`, `supabase/migrations/20260916000000_reenable_rls_and_drop_username_unique.sql` | ✅ **Done** — Verified no sensitive data leaked. RLS re-enabled. |
| **Low** | All Supabase queries in `DataContext.tsx` use `.select("*")` — fetching all columns even when only a subset is needed. This increases payload size and bandwidth. | `context/DataContext.tsx:104-111` | Use `.select("id, patient_name, total_cost, ...")` to fetch only needed columns. |
| **Low** | The `labs` and `case_types` RLS policies use `USING (true)` for SELECT — any authenticated user can read all labs/case types. This is intentional (reference data) but worth noting. | `supabase/migrations/20260908000000_initial_schema.sql:362-365, 386-389` | No action needed if this is the intended behavior. |

---

## Recommended Order of Fixes

1. **Create `app/global-error.tsx`** — prevents white-screen crashes (High, quick fix)
2. ~~**Decide on Server Components vs. all-client architecture** — either commit to client-side (and document why) or migrate data-fetching to Server Components using `lib/supabase/server.ts` (High, architectural decision)~~ ✅ **Done** — Accepted client-side for admin dashboard. Performance comes from DataContext pagination.
3. ~~**Remove or implement `lib/supabase/admin.ts`** — dead code with a service-role key is a security liability (High)~~ ✅ **Done**
4. ~~**Add security headers in `next.config.ts`** — Medium, quick fix~~ ✅ **Done**
5. ~~**Add `loading.tsx` files** — Medium, improves UX~~ ✅ **Done** — Not necessary yet. Existing skeleton loaders cover this.
6. ~~**Implement Account Settings** — the TODO stubs are a functional gap (Medium)~~ ✅ **Done**
7. ~~**Add pagination to DataContext queries** — Medium, prevents performance degradation~~ ✅ **Done** — Records filtered by active month. Payments kept all (small). Reference data kept all (bounded).
8. **Write Playwright e2e tests** — Medium, critical for production confidence
9. ~~**Remove dead code** (`AppSidebar.tsx`, unused `requiredRole` prop) — Low~~ ✅ **Done**
10. **Add structured error logging** — Low, improves production observability
