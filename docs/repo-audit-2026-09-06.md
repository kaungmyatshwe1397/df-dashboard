# Repo Audit: DC-FMS (DF Dashboard)
Date: 2026-09-06
Scope: Security, Architecture & Scalability, Reliability & Maintainability, Third-Party Services (Supabase)

## Summary
The codebase is well-structured with clean separation of Supabase clients (browser vs server), proper RLS policies on all tables, and good TypeScript strictness. The most critical issue is that `DataContext.tsx` calls `auth.admin.updateUserById` and `auth.admin.deleteUser` from client-side code — these methods require a service role key that only exists server-side, so they will always fail at runtime. Beyond that, route protection is entirely client-side (no server-side middleware guard), and there are no error boundaries or loading states. The app also fetches all data upfront without pagination, which will cause performance and cost issues as data grows.

## Findings by category

### Security
| Severity | Issue | Location | Fix |
|---|---|---|---|
| High | Auth protection is client-only — `PortalLayout` redirects via `useEffect` after render, meaning protected pages briefly flash content to unauthenticated users. Middleware only refreshes sessions, never guards routes. | `components/layout/PortalLayout.tsx:22-28`, `middleware.ts` | Add route matching logic in middleware to check session and redirect to `/login` for unauthenticated requests to protected routes (`/admin/*`, `/assistant/*`). Return 401 or redirect from middleware before the page renders. |
| High | `auth.admin.updateUserById()` and `auth.admin.deleteUser()` called from `"use client"` context — these require service role key which is not present in the browser client. Will fail at runtime and is a misuse of admin APIs from the browser. | `context/DataContext.tsx:760`, `context/DataContext.tsx:776` | Move user password updates and user deletion to Server Actions or API Route Handlers that use the service role key server-side. Remove admin auth calls from DataContext. |
| Medium | Public signup page (`/signup`) has no rate limiting or abuse protection — anyone can create assistant accounts. | `app/signup/page.tsx`, `context/DataContext.tsx:693-733` | Add CAPTCHA, email verification, or at minimum a server-side rate limit on signup attempts per IP. |
| Medium | Demo credentials (`admin@test.com` / `admin123`, `assistant@test.com` / `assist123`) committed in `.env.local` comments. If repo is ever made public, these are visible. | `.env.local:5-7` | Remove demo credentials from `.env.local`. Store them in a separate, non-committed doc or in the README with a clear warning. |
| Low | No security headers configured in `next.config.ts` (no CSP, X-Frame-Options, etc.). | `next.config.ts` | Add `headers()` config with `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` at minimum. |

### Architecture & Scalability
| Severity | Issue | Location | Fix |
|---|---|---|---|
| Medium | `DataContext.tsx` is 835 lines with 15+ state variables and 15+ functions — a monolithic "god context" that handles records, payments, financials, users, labs, case types, and all CRUD operations. Hard to test, maintain, and reason about. | `context/DataContext.tsx` | Split into domain-specific contexts/hooks: `useRecords`, `usePayments`, `useFinancials`, `useUsers`. Each with its own state and operations. |
| Medium | All data fetched upfront on every mount — entire `patient_records`, `case_payments`, `monthly_financials`, `monthly_cycles`, `labs`, `case_types`, and `profiles` tables loaded into memory with no pagination or lazy loading. | `context/DataContext.tsx:172-180` | Add pagination (`.range()`) on list queries. Fetch only the active cycle's data on load, fetch other months on demand. Use React Query or SWR for caching/refetching. |
| Medium | `fetchData` re-runs via `refreshKey` increment — no deduplication, no stale-while-revalidate, no background refetch. Every `refreshData()` call shows a full loading spinner. | `context/DataContext.tsx:244-247` | Adopt a data-fetching library (TanStack Query, SWR) for deduplication, caching, background refresh, and optimistic updates. |
| Low | `next.config.ts` is empty — no image optimization config, no `images.remotePatterns`, no bundle analysis setup. | `next.config.ts` | Add `images` config if using external images. Consider `poweredByHeader: false`. |

### Reliability & Maintainability
| Severity | Issue | Location | Fix |
|---|---|---|---|
| High | No `error.tsx`, `global-error.tsx`, or `loading.tsx` files anywhere in the app tree. Unhandled errors show a blank screen or default Next.js error page; slow data loads show nothing. | `app/` directory (missing files) | Create `app/error.tsx` and `app/global-error.tsx` for error boundaries. Add `loading.tsx` at `app/admin/loading.tsx` and `app/assistant/loading.tsx` for Suspense loading states. |
| Medium | Error handling in DataContext is `console.error` only — errors are swallowed and never surfaced to the UI (no toast, no error state propagation). Callers of `addRecord`, `updateRecord`, etc. have no way to know if an operation failed. | `context/DataContext.tsx:297,346,369,429,454,601` | Return success/failure from all async operations. Add a toast notification system or propagate errors through context state. |
| Medium | Only 6 test files exist for an app with auth, complex financial calculations, CRUD operations, and user management. Core logic (DataContext operations, payment calculations, carry-forward logic) is untested. | `lib/__tests__/`, `context/__tests__/`, `components/__tests__/` | Add unit tests for DataContext operations (addRecord, addPayment, carryForward, deleteMonth), financial calculations, and auth flows. Target at minimum: `DataContext.test.tsx` covering CRUD + edge cases. |
| Low | No CI/CD pipeline — no automated lint, typecheck, or test runs on push/PR. | (missing `.github/workflows/`) | Add a GitHub Actions workflow that runs `npm run lint`, `npm run typecheck` (if added), and `npm test` on PRs. |

### Third-Party Services (Supabase)
| Severity | Issue | Location | Fix |
|---|---|---|---|
| High | `auth.admin.updateUserById` and `auth.admin.deleteUser` require service role key but are called from browser client code (`DataContext.tsx` with `"use client"`). The browser client only has the publishable/anon key, so these calls will always fail with a permissions error. | `context/DataContext.tsx:760,776` | Create Server Actions (`app/admin/actions.ts`) that use `lib/supabase/server.ts` with service role key for admin user operations. Call those from DataContext instead. |
| Medium | No error handling around Supabase calls in several places — `deleteRecord`, `toggleLock`, `carryForward`, `deleteMonth` don't check errors or propagate failures. | `context/DataContext.tsx:406-415,592-609,611-661,663-687` | Add error checking after every `.from().delete()`, `.from().update()` call. Return error info to callers. |
| Medium | Full table scans on `patient_records` and `case_payments` with no `.range()` — as records accumulate across months, fetch times and Supabase costs will grow linearly. | `context/DataContext.tsx:174-175` | Add `.range()` limits to initial fetches. Paginate by month or use infinite scroll. |
| Low | `lib/supabase/__mocks__/` directory is empty — no Supabase mocks for testing. | `lib/supabase/__mocks__/` | Add mock implementations of the Supabase client for unit testing components and context that depend on it. |

## Recommended order of fixes
1. **Move `auth.admin` calls to Server Actions** — currently broken in production, simplest fix with highest impact
2. **Add middleware route protection** — prevents unauthenticated access to protected pages at the server level
3. **Add `error.tsx` / `loading.tsx`** — prevents blank screens on errors and slow loads
4. **Surface errors to UI** — replace `console.error` with user-facing error states/toasts
5. **Split DataContext** — reduces complexity and makes the codebase testable
6. **Add pagination** — prevents performance degradation and cost growth
7. **Add CI workflow** — catches regressions before they reach production
8. **Add security headers** — quick win for defense-in-depth
