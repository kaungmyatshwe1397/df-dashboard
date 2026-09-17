# Contributing Guide

## Development Workflow

### 1. Branch from `main`

```bash
git checkout -b feat/your-feature-name
```

### 2. Make Changes

Follow the existing code patterns:

- Use shadcn/ui components for all UI elements
- Reference design tokens from `docs/tokens.md` — never hardcode hex/pixel values
- Follow `docs/comment_methods.md` for code comments
- Follow `docs/clea-code.md` for clean code standards

### 3. Run Checks Before Committing

```bash
npm run typecheck    # TypeScript errors
npm run lint         # ESLint errors
npm run test         # Unit tests
```

All three must pass before committing.

### 4. Commit

Use conventional commits:

```
feat: add new feature
fix: bug fix
refactor: code restructuring
docs: documentation changes
test: adding tests
chore: maintenance tasks
```

### 5. Create PR

- Target `main` branch
- CI will run lint, typecheck, and tests
- Request review if changes are significant

## Code Standards

### Components

- Use `"use client"` directive for interactive components
- Extract reusable logic into custom hooks
- Keep components focused — one responsibility per file

### Types

- Use TypeScript interfaces for all data shapes
- Generate types from the ERD (`docs/dc-fms-erd.mmd`)
- Never use `any` type

### Styling

- Use Tailwind CSS utility classes
- Reference tokens from `docs/tokens.md`
- Use `cn()` utility for conditional classes

### Testing

- Write unit tests for utility functions
- Write component tests for complex UI logic
- See `docs/testing-guide.md` for guidelines

## Project Conventions

| Convention | Standard |
|------------|----------|
| Component files | PascalCase (`RevenueChart.tsx`) |
| Utility files | camelCase (`data-helpers.ts`) |
| Test files | `*.test.ts` or `*.test.tsx` |
| Types | PascalCase interfaces (`PatientRecord`) |
| Enums | PascalCase with UPPER_CASE values |
