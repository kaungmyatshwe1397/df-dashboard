# DC-FMS — Dental Clinic Financial Management System

A web-based dashboard for dental clinics to track patient records, manage monthly billing cycles, reconcile lab fees, calculate doctor commissions, and generate financial reports.

Built for a two-role workflow: **Admin** (clinic owner) and **Assistant** (clinic staff).

## What It Does

DC-FMS replaces the manual paper logbook workflow with a digital system that handles:

- **Patient record entry** — log treatments with diagnosis, cost, and payment status
- **Monthly billing cycles** — automatically carry forward unpaid case balances across months
- **Payment tracking** — record installment payments and calculate remaining balances
- **Lab fee reconciliation** — assign laboratory fees to specific case treatments
- **Financial calculations** — compute doctor commission (40%), overhead expenses, and net profit/loss
- **Month-end closeout** — lock completed records, carry forward unsettled cases, and open new cycles

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

### Month-End Closeout

- Carry forward unsettled cases to the next month
- Hard delete of completed records
- Auto-create next billing cycle

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

## Getting Started

### Prerequisites

- Node.js 20+
- Supabase account (or Docker for local development)

### Installation

```bash
npm install
```

### Environment Variables

Create `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_secret_key
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Local Database (Optional)

Requires Docker Desktop running:

```bash
npx supabase start     # Start local Supabase stack
npx supabase db reset  # Reset and apply migrations
npx supabase db seed   # Seed test data
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | System architecture, data flow, and key decisions |
| [Contributing](docs/contributions.md) | Development workflow, code standards, and conventions |
| [ERD](docs/dc-fms-erd.mmd) | Database schema and relationships |
| [User Flow](docs/dc-fms-user-flow.mermaid) | Navigation paths and screen flow |
| [UI States](docs/dc-fms-ui-states-checklist.md) | Required states for every screen |
| [Design Tokens](docs/tokens.md) | Spacing, typography, and color system |
| [PRD](docs/prd.md) | Product requirements and business logic |
| [Testing Guide](docs/testing-guide.md) | When and how to write tests |
| [Code Style](docs/clea-code.md) | Clean code standards |
| [Comment Methods](docs/comment_methods.md) | When and how to write comments |
| [Repo Audit](docs/repo-audit-2026-09-16.md) | Security, architecture, and reliability audit |

## Project Structure

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

## License

MIT
