# DC-FMS — Dental Clinic Financial Management System

A dashboard for tracking patient records, monthly cycles, lab reconciliation, overhead expenses, and financial closeouts. Built for a two-role workflow (Admin + Assistant) with role-based access control.

**Tech Stack:** Next.js 16 (App Router) · Tailwind CSS · shadcn/ui · TypeScript · Vitest

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Default credentials in `lib/mock-data.ts`.

## Project Structure

```
app/              # Route pages (admin/, assistant/)
components/       # Feature modules (records/, dashboard/, overhead/, reconciliation/, users/, shared/)
context/          # DataContext (data) + AuthContext (auth)
lib/              # Types, mock data, utilities
docs/             # ERD, user flow, UI states, design tokens
plans/            # Backend, frontend, and user management plans
```

## License

MIT
