# Architecture

## Overview

DC-FMS is a full-stack Next.js application backed by Supabase (PostgreSQL). It follows a client-side rendered architecture with role-based access control (Admin + Assistant).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| Testing | Vitest |

## Data Flow

```
Supabase (PostgreSQL)
    ↓
Supabase Client (browser)
    ↓
DataContext (React Context)
    ↓
UI Components (pages, forms, tables, charts)
```

## Key Architecture Decisions

### Client-Side Rendering

The entire app uses `"use client"` components. This was a deliberate decision:

- Admin dashboard behind auth — no SEO concern
- PortalLayout and DashboardKPIs are inherently interactive
- Server Component conversion provides minimal benefit for this use case

### DataContext

Central data layer that:

- Fetches reference data (cycles, labs, case_types, financials) once on mount
- Fetches patient_records filtered by active month
- Fetches all case_payments (small table, needed for balance calculations)
- Provides CRUD operations for records, payments, financials, labs, case_types

### Atomic record creation

New GP/CASE saves call `save_registered_record` through `atomicRecordSaveService`. The database creates or reuses the record-date cycle, verifies the registry patient, inserts the visit, and inserts any initial CASE payment within one transaction. Any error rolls back all writes, including the submission ledger. Existing record edits and later installment payments use their existing paths.

The form generates one UUID per submission and retains it after errors. `record_save_submissions` privately stores the authenticated owner, canonical JSON request, and committed result. A unique key and row lock serialize concurrent retries. Identical retries return the original result; different data under a committed submission ID is rejected. Retry the original values to recover an uncertain save, then use Edit for corrections. Closing/resetting the form starts a new submission; this identity does not survive a browser reload.

The RPC uses `SECURITY DEFINER` with an empty search path, an explicit Admin/Assistant check, owner checks, and the existing registry function's treatment-field whitelist. Browser roles have no direct ledger access. No financial totals are returned. Date validation in the database uses the clinic timezone, `Asia/Bangkok`; the form still defaults from the user's local calendar.

Apply `supabase/migrations/20261011000000_atomic_record_save.sql` before releasing the corresponding frontend. See [atomic save implementation notes](../superpowers/plans/2026-10-11-atomic-record-save.md) for the deferred check list and [verification instructions](../lib/atomic-record-save.md).

### Role-Based Access

| Feature | Assistant | Admin |
|---------|-----------|-------|
| Patient data entry | Create, read, update | Full CRUD |
| Financial dashboard | Hidden | Full access |
| Lab fee assignment | Hidden | Full access |
| Carry forward | Hidden | Full access |
| User management | Hidden | Full access |

## Database Schema

See [ERD](./dc-fms-erd.mmd) for the full schema.

Core tables:
- `monthly_cycles` — passive month buckets (`month_year` unique; no lock/close status)
- `patient_records` — treatment records (GP/Case)
- `case_payments` — installment payments
- `monthly_financials` — monthly expense summary
- `labs` — reference table for laboratories
- `case_types` — reference table for case types

## File Structure

```
app/                    # Route pages (admin/, assistant/)
components/             # Feature modules
  dashboard/            # KPIs, RevenueChart
  records/              # RecordTable, PatientRecordUpdateForm
  overhead/             # OverheadForm
  reconciliation/       # LabReconciliationTable, manage/
  users/                # UserManagementTable
  settings/             # AccountSettingsModal
  layout/               # PortalLayout, TopNav
context/                # DataContext + AuthContext
lib/                    # Types, utilities, Supabase clients
supabase/               # Database migrations
docs/                   # Documentation
plans/                  # Current plans; read only when relevant to the task
legacyPlans/             # Archived plans; historical context only
```

## CI/CD

GitHub Actions runs on PRs to `main`:
- Linting
- Type checking
- Tests
