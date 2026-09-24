# DC-FMS — Dental Clinic Financial Management System

A web-based dashboard for dental clinics to track patient records, manage monthly billing cycles, reconcile lab fees, calculate doctor commissions, and generate financial reports.

Built for a two-role workflow: **Admin** (clinic owner) and **Assistant** (clinic staff).

## What It Does

DC-FMS replaces the manual paper logbook workflow with a digital system that handles:

- **Patient record entry** — log treatments with diagnosis, cost, and payment status
- **Monthly buckets** — each month is a passive bucket; unpaid case balances carry forward on demand
- **Payment tracking** — record installment payments and calculate remaining balances
- **Lab fee reconciliation** — assign laboratory fees to specific case treatments
- **Financial calculations** — compute doctor commission (40%), overhead expenses, and net profit/loss
- **Carry forward** — move unsettled case balances into the next month (no lock/close workflow)

## Features

### Patient Records

- Two record types: **GP** (single-session) and **Case** (multi-installment)
- Auto-generated patient IDs per cycle (e.g., `0001/26`)
- Inline editing and bulk operations
- Payment history tracking with balance calculations

### Financial Dashboard

- Real-time KPIs: Gross income, lab fees, doctor commission, overhead, net profit/loss
- Revenue trend chart with two views: **This Month** (daily) and **Every Month** (monthly)
- Operating expense breakdown (general, salary, bonus, rent, utilities)

### Lab Reconciliation

- Group case records by assigned laboratory
- Input lab fees per case with auto-aggregation
- Track lab payment status (paid/unpaid)

### Carry Forward

- Move unsettled case balances to the next month
- Auto-creates the next month bucket
- Fully paid cases stay in the current month

### User Management

- Admin can create assistant accounts
- Password change with current password verification
- Profile update (username)
- Account deletion handled by admin via Supabase dashboard

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Testing | Vitest |

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | System architecture, data flow, key decisions, and project structure |
| [Contributing](docs/contributions.md) | Getting started, setup, scripts, development workflow, and conventions |
| [ERD](docs/dc-fms-erd.mmd) | Database schema and relationships |
| [User Flow](docs/dc-fms-user-flow.mermaid) | Navigation paths and screen flow |


## License

MIT
