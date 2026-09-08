# DC-FMS — Dental Clinic Financial Management System

A dashboard for tracking patient records, monthly cycles, lab reconciliation, overhead expenses, and financial closeouts. Built for a two-role workflow (Admin + Assistant) with role-based access control.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Testing:** Vitest

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

## Project Structure

```
app/                    # Route pages (admin/, assistant/)
components/             # Feature modules (records/, dashboard/, overhead/, reconciliation/, users/, shared/)
context/                # DataContext (data) + AuthContext (auth)
lib/                    # Types, utilities, Supabase clients
docs/                   # ERD, user flow, UI states, design tokens, audit reports
plans/                  # Backend, frontend, and user management plans
supabase/               # Database migrations and seed data
```

## Database

Migrations are in `supabase/migrations/`. Push to production:

```bash
npx supabase db push
```

## CI/CD

GitHub Actions runs on PRs to `main`:
- Linting
- Type checking
- Tests

## License

MIT
