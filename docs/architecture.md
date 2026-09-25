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
plans/                  # Development plans
```

## CI/CD

GitHub Actions runs on PRs to `main`:
- Linting
- Type checking
- Tests
