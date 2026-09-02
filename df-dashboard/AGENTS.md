# AGENTS.md — DC-FMS Frontend

## Context Files (Read Before Starting)

| File | Purpose |
|------|---------|
| `docs/frontend-plan.md` | Frontend build plan — 10 tasks with mock state, pure UI development. |
| `docs/backend-draft-plan.md` | Backend draft plan — Supabase setup, schema, RLS, client config. |
| `docs/tokens.md` | Design tokens — spacing, typography, colors. Use these, never hardcode values. |
| `docs/dc-fms-user-flow.mermaid` | Information architecture — all screens and navigation paths. |
| `docs/dc-fms-erd.mmd` | Database schema — types for all Supabase tables and relationships. |
| `docs/dc-fms-ui-states-checklist.md` | UI states — every screen must handle ideal, empty, loading, error, edge case. |
| `docs/prd.md` | Product requirements — business logic, roles, permissions, formulas. |
| `docs/comment_methods.md` | Commenting standards — when to comment, when not to, formatting rules. |
| `docs/testing-guide.md` | Testing guide — when to test, what type to use, how to write tests. |

## Rules

1. **Read `docs/tokens.md` first** before writing any component. Reference tokens by name, not raw values.
2. **Read `docs/dc-fms-erd.mmd`** to understand data shapes. Generate TypeScript types from the ERD before building forms or tables.
3. **Read `docs/dc-fms-user-flow.mermaid`** to know which screen you are on and where it leads.
4. **Read `docs/dc-fms-ui-states-checklist.md`** for the current screen. Implement all 5 states (ideal, empty, loading, error, edge case) before moving on.
5. **Read `docs/prd.md`** for business rules. Enforce role-based visibility (Assistant never sees financial totals).
6. **Tech stack only:** Next.js (App Router), Tailwind CSS, Lucide React Icons, **shadcn/ui**. Use shadcn components for all UI elements.
7. **Mobile_responsive** required.
8. **Never hardcode hex, pixel, or font-size values.** Always use CSS variable tokens.
9. **Use shadcn components** for all UI: Button, Input, Label, Card, Dialog, Table, Badge, Alert, Select, Textarea, Skeleton, Sidebar, Separator, Pagination, Progress, RadioGroup, etc. Never build custom components when shadcn provides them.
10. **Follow `docs/comment_methods.md`** for all code comments. Explain *why*, not *what*. No redundant syntax restatements, no dead/commented-out code.

## Library & External Documentation Rule
- Whenever working with a new library, an external framework (e.g., Tailwind CSS, shadcn/ui, Next.js), or when interacting with libraries after a long duration, you **MUST** use the Context7 MCP server  to check their latest official documentation first.
- Always retrieve up-to-date syntax, configuration rules, and breaking changes from Context7, and explicitly summarize those updates/changes before writing or modifying code.