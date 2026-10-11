# AGENTS.md — DC-FMS Frontend

## Project Documents (Read When Relevant)

| File | Purpose |
|------|---------|
|      |         |
| `docs/diagram/dc-fms-user-flow.mermaid` | Screen and navigation flow — consult when changing navigation. |
| `docs/diagram/dc-fms-erd.mmd` | Database entities and relationships — consult when changing data shapes. |
| `docs/lib/dc-fms-ui-states-checklist.md` | Screen states — consult when changing a screen. |
| `docs/lib/prd.md` | Product requirements — consult when changing business rules or permissions. |
| `docs/lib/architecture.md` | Current code organization and architecture. |
| `docs/rules/comment_method-rules.md` | Commenting standards — when to comment, when not to, formatting rules. |
| `docs/rules/testing-guide-rules.md` | Testing guide — when to test, what type to use, how to write tests. |
| `docs/rules/my-rules.md` | Specific rules set by my prefernce |
| `docs/rules/project-folder-rules.md` | Component architecture and file organization. |
| `docs/rules/clean-code-rule.md` | code writing rules file - how to write clean code inside this project. |

`plans/` is for current plans. Read a plan only when the task clearly depends on it. `legacyPlans/` contains archived plans; do not read them unless the user asks for historical context.

## Rules

1. **Use design tokens from `docs/lib/tokens.md`** when changing UI. Do not introduce raw colors, spacing, or font sizes.
2. **Inspect existing TypeScript types and the ERD** when changing data shapes; update types only as required by the change.
3. **Check the relevant user flow and UI-state checklist** when changing navigation or a screen.
4. **Follow product permissions:** assistants must never see financial totals.
5. **Tech stack only:** Next.js (App Router), Tailwind CSS, Lucide React Icons, **shadcn/ui**. Use shadcn components for all UI elements.
6. **Mobile_responsive** required.
7. **Never hardcode hex, pixel, or font-size values.** Always use CSS variable tokens.
8. **Use shadcn components** for all UI: Button, Input, Label, Card, Dialog, Table, Badge, Alert, Select, Textarea, Skeleton, Sidebar, Separator, Pagination, Progress, RadioGroup, etc. Never build custom components when shadcn provides them.
9. **Follow `docs/rules/comment_method-rules.md`** for all code comments. Explain *why*, not *what*. No redundant syntax restatements, no dead/commented-out code.
10. **Write descriptive comment** when creating a new `.ts` or `.tsx` file, following `docs/rules/comment_method-rules.md`.
11. **Write a TODO list of required unit or component tests** when tests are deferred.
12. **Follow the interface naming convention** in `docs/rules/my-rules.md`.
13. **Follow `docs/rules/project-folder-rules.md`** for component architecture and file organization.
14. **Follow `docs/rules/clean-code-rule.md`** for maintainable code.

## Library & External Documentation Rule
- Whenever working with a new library, an external framework (e.g., Tailwind CSS, shadcn/ui, Next.js), or when interacting with libraries after a long duration, you **MUST** use the `Context7 MCP server`  to check their latest official documentation first.
- Always retrieve up-to-date syntax, configuration rules, and breaking changes from Context7, and explicitly summarize those updates/changes before writing or modifying code.