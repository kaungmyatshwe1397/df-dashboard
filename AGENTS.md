# AGENTS.md — DC-FMS Frontend

## Context Files (Read Before Starting)

| File | Purpose |
|------|---------|
| `frontend-plan.md` | Frontend build plan — 10 tasks with mock state, pure UI development. |
| `backend-draft-plan.md` | Backend draft plan — Supabase setup, schema, RLS, client config. |
| `tokens.md` | Design tokens — spacing, typography, colors. Use these, never hardcode values. |
| `dc-fms-user-flow.mermaid` | Information architecture — all screens and navigation paths. |
| `dc-fms-erd.mmd` | Database schema — types for all Supabase tables and relationships. |
| `dc-fms-ui-states-checklist.md` | UI states — every screen must handle ideal, empty, loading, error, edge case. |
| `prd.md` | Product requirements — business logic, roles, permissions, formulas. |

## Rules

1. **Read `tokens.md` first** before writing any component. Reference tokens by name, not raw values.
2. **Read `dc-fms-erd.mmd`** to understand data shapes. Generate TypeScript types from the ERD before building forms or tables.
3. **Read `dc-fms-user-flow.mermaid`** to know which screen you are on and where it leads.
4. **Read `dc-fms-ui-states-checklist.md`** for the current screen. Implement all 5 states (ideal, empty, loading, error, edge case) before moving on.
5. **Read `prd.md`** for business rules. Enforce role-based visibility (Assistant never sees financial totals).
6. **Tech stack only:** Next.js (App Router), Tailwind CSS, Lucide React Icons, **shadcn/ui**. Use shadcn components for all UI elements.
7. **Mobile_responsive** required.
8. **Never hardcode hex, pixel, or font-size values.** Always use CSS variable tokens.
9. **Use shadcn components** for all UI: Button, Input, Label, Card, Dialog, Table, Badge, Alert, Select, Textarea, Skeleton, Sidebar, Separator, Pagination, Progress, RadioGroup, etc. Never build custom components when shadcn provides them.
