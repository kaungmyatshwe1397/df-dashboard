# DC-FMS — Dental Clinic Financial Management System

## Product Summary

From a patient's first visit to the month's final figures, DC-FMS brings the clinic's daily work into one shared workspace. Staff can register patients, record treatments, and track payments as they happen. Clinic owners can follow income, reconcile laboratory fees, and see how commissions and operating expenses affect profit.

It replaces paper logbooks and manual month-end calculations with connected patient records and monthly financial views. Unpaid case balances can move into the next month, so ongoing treatments stay easy to follow.

Designed for both the clinic desk and a phone, DC-FMS uses detailed tables on larger screens and readable cards with touch-friendly forms on mobile.

### Who It's For

| Role | Workflow |
|------|----------|
| **Admin** | Manage clinic finances, laboratory fees, expenses, settings, and user accounts. |
| **Assistant** | Register patients, record treatments, and track payments without access to clinic financial totals. |
| **Supervisor** | Review the admin portal with read-only access, excluding user management. |

## Features

### Patient Registry and Treatment Records

- Register patients with a unique patient ID, contact details, and medical history.
- Search the registry, view patient profiles, and reuse registered patients across visits.
- Record **GP** treatments for single-session visits and **Case** treatments with installment payments.
- Add and edit treatment details, track payment history, and view remaining balances.

### Financial Dashboard

- View gross income, lab fees, doctor commission (40%), overhead, and net profit/loss.
- Explore revenue trends through **This Month** (daily) and **Every Month** (monthly) views.
- Track general expenses, salaries, bonuses, rent, utilities, and named additional expenses.

### Lab Reconciliation

- Group case records by laboratory and filter by the selected lab.
- Enter fees per case, save on blur or Enter, and view aggregated laboratory totals.
- Track paid/unpaid laboratory status and manage laboratories and case types.

### Carry Forward

- Organize records in monthly buckets without a lock or close workflow.
- Move unsettled case balances to the next month, creating the next bucket when needed.
- Keep fully paid cases in their original month.

### Accounts and Access

- Admins can create accounts, change user roles, and delete accounts within the app.
- Update usernames and change passwords with current-password verification.
- Provide role-based access for Admins, Assistants, and read-only Supervisors.

### Mobile Experience and Themes

- Browse treatment records, patients, and users as cards on mobile and tables on desktop.
- Enter data through stacked forms and dialogs that adapt to the mobile keyboard.
- Use responsive navigation, touch-friendly controls, and compact pagination.
- Switch between light and dark themes.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI Runtime | React 19 |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn/ui |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Charts | Recharts |
| Testing | Vitest and React Testing Library |

## Documentation

Start with the contributing guide to run the project, or the product requirements to understand the clinic workflow.

### Product and Architecture

| Document | Description |
|----------|-------------|
| [Contributing and Setup](docs/lib/contributions.md) | Local setup, scripts, development workflow, and conventions. |
| [Product Requirements](docs/lib/prd.md) | Business rules, roles, permissions, and financial calculations. |
| [Architecture](docs/lib/architecture.md) | System structure, data flow, and key decisions. |
| [Database ERD](docs/diagram/dc-fms-erd.mmd) | Database tables and relationships in Mermaid format. |
| [User Flow](docs/diagram/dc-fms-user-flow.mermaid) | Screens and navigation paths in Mermaid format. |

### Design and Development Guides

| Document | Description |
|----------|-------------|
| [Design Tokens](docs/lib/tokens.md) | Shared colors, spacing, typography, and visual rules. |
| [UI States Checklist](docs/lib/dc-fms-ui-states-checklist.md) | Ideal, empty, loading, error, and edge-case states. |
| [Mobile Responsive Design](docs/superpowers/specs/2026-10-10-mobile-responsive-design.md) | Approved hybrid layout, mobile data entry, and responsive behavior. |
| [Mobile Implementation Plan](docs/superpowers/plans/2026-10-10-mobile-responsive.md) | Tasks and implementation details for mobile support. |
| [Light and Dark Theme Design](docs/superpowers/specs/2026-10-09-light-dark-theme-design.md) | Theme behavior and design decisions. |
| [Project Folder Rules](docs/rules/project-folder-rules.md) | Component architecture and file organization. |
| [Clean Code Rules](docs/rules/clean-code-rule.md) | Coding and maintainability standards. |
| [Commenting Rules](docs/rules/comment_method-rules.md) | File headings and guidelines for useful comments. |
| [Project Conventions](docs/rules/my-rules.md) | Type naming and project-specific working rules. |
| [Testing Guide](docs/rules/testing-guide-rules.md) | Test selection, structure, and writing guidelines. |
| [Task Completion Rules](docs/rules/task-completion-rule.md) | Checklist for documenting completed plan tasks. |

### Project Plans

| Document | Description |
|----------|-------------|
| [Frontend Plan](plans/frontend-plan.md) | Frontend screens and implementation tasks. |
| [Backend Integration Plan](plans/backend-plan.md) | Supabase schema, authentication, RLS, and data integration. |
| [User Management Plan](plans/user-management-plan.md) | Account administration and password workflows. |
| [Patient ID Plan](plans/patient-unique-id-plan.md) | Shared patient registry and unique patient IDs. |


## License

MIT
