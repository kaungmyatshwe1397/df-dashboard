# Repo Audit: DC-FMS

**Date:** 2026-10-09  
**Scope:** Security, Architecture & Scalability, Reliability & Maintainability, Third-Party Services (Supabase)

## Summary

The project has a useful security baseline: middleware checks authenticated roles, privileged server actions recheck the caller, Supabase clients are separated by runtime, and RLS policies cover the application tables. The most urgent risk is that Supabase Auth signup is enabled in the checked-in configuration while newly registered users receive the `ASSISTANT` role, which grants access to patient data under the current RLS policies. Financial operations also use separate client requests, so a failure partway through payment recording or carry-forward can leave partial state. Several queries fetch data across all months or records, which will grow with clinic history.

## Findings by category

### Security

| Severity | Issue | Location | Fix |
|---|---|---|---|
| **High** | Self-service Supabase signups are enabled. The signup trigger creates each new profile as `ASSISTANT`, and assistant RLS policies permit reading patient records and patient registry data. A person who can reach the Supabase Auth endpoint with the public key can create an account and access clinic data even though the app has no public signup screen. Confirm production Auth settings match this config; disable public signups or require an invitation/approval flow before granting data access. | `supabase/config.toml` (`auth.enable_signup`, `auth.email.enable_signup`); `supabase/migrations/20260924190000_initial_schema.sql` (`handle_new_user`, patient and record SELECT policies) | Disable self-registration for the hosted project, or make new accounts inactive until an administrator explicitly grants an appropriate role. |

### Architecture & Scalability

| Severity | Issue | Location | Fix |
|---|---|---|---|
| **Medium** | Month changes reload every `case_payments` row, and the revenue chart independently selects all patient-record and payment history. These full-history reads and client-side aggregation grow with the lifetime dataset and can hit Supabase response limits. | `context/DataContext.tsx` (`fetchMonthData`); `components/dashboard/RevenueChart.tsx` (history queries) | Filter payments to relevant record IDs/months and move historical chart aggregation to bounded paginated queries or a database view/RPC. |

### Reliability & Maintainability

| Severity | Issue | Location | Fix |
|---|---|---|---|
| **Medium** | Payment recording inserts a payment and then updates the record balance in a separate request. If the second request fails, payment history and the denormalized `paid`/`remaining` fields disagree. Initial payments and record creation are also separate requests, so an initial-payment failure leaves a created record without that payment. | `context/DataContext.tsx` (`addPayment`, `addRecord`) | Put related database writes in transactional RPCs, or derive balances only from payment rows and provide a reconciliation path for failures. |
| **Medium** | Carry-forward updates unsettled records sequentially. If an update fails after earlier records succeeded, the operation stops with only part of the month moved and no single atomic result for the user. | `context/DataContext.tsx` (`carryForward`) | Move the operation into a transactional database function or use a single bulk update with explicit retry/recovery behavior. |
| **Low** | There is a route error boundary but no root `global-error.tsx`. Errors thrown by the root layout can therefore bypass the app's route-level fallback UI. | `app/error.tsx`; missing `app/global-error.tsx` | Add a root error boundary with a recovery action if root-layout failures need a branded, recoverable screen. |

### Third-Party Services (Supabase)

| Severity | Issue | Location | Fix |
|---|---|---|---|
| **Medium** | Hosted Supabase Auth redirect allowlists, signup settings, and migration drift cannot be verified from this repository. The committed local config permits `127.0.0.1` redirects and signup; production dashboard settings may differ. | `supabase/config.toml`; hosted Supabase project settings | Verify production redirect URLs and signup policy, and regularly compare the hosted schema with committed migrations. |

## Recommended order of fixes

1. Disable public Supabase signup or gate newly created accounts before they receive assistant access to patient data.
2. Make payment creation/balance changes and carry-forward atomic, then reconcile any existing inconsistent rows.
3. Bound payment and chart history reads with filtering, pagination, or database aggregation.
4. Verify hosted Supabase Auth and migration settings against the repository configuration.
5. Consider adding a root `global-error.tsx` fallback.
