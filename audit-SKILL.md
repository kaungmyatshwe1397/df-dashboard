---
name: repo-audit
description: Audit a Next.js + Supabase codebase for security, architecture, scalability, reliability, maintainability, and safe use of third-party services (especially Supabase). Produces a saved Markdown report with findings rated High/Medium/Low severity plus concrete fixes. Use this whenever the user asks to "audit", "review", "check", "assess", or "score" their repo, codebase, or project — for code quality, security holes, scalability limits, technical debt, production-readiness, or whether Supabase/auth/third-party services are set up safely — even if they only name one category (e.g. "just check my security"). Also trigger for phrases like "is my repo production-ready", "security review before launch", "check my architecture", "am I using Supabase safely", or "review my Next.js app".
---

# Repo Audit (Next.js + Supabase)

## Why this exists

A single review pass over a repo tends to focus on whatever the reviewer notices first — usually code style. This skill makes sure five different failure modes all get checked on purpose: things that get **hacked** (security), things that get **slow or fall over under load** (architecture/scalability), things that **break in production** (reliability), things that get **hard to change later** (maintainability), and things that go wrong because a **third-party service** (mainly Supabase) was wired up incorrectly. Missing any one of these is how "it works on my machine" becomes an incident.

## Workflow

1. **Find the repo.** If a path isn't given, ask, or use the current working directory if it's clearly a Next.js project (has `package.json` with `next` as a dependency).

2. **Get the lay of the land first.** Before checking anything, look at:
   - `package.json` (dependencies, scripts, Next.js + Supabase versions)
   - Folder structure (`app/` or `pages/`, `lib/`, `middleware.ts`, `supabase/`)
   - `.env.example` or `.env.local` (names only — never print real secret values into the report)
   - `next.config.js` / `next.config.ts`
   - Any `supabase/migrations/` folder

   This context makes the checklist checks below much faster and more accurate, since you'll already know where auth, data access, and config live.

3. **Work through each category** using its checklist. The checklists are in `references/` — read the ones relevant to the audit scope the user asked for (all four if they asked for a full audit). Each checklist explains *why* a check matters, not just what to look for — use that reasoning to judge borderline cases in this specific codebase, rather than mechanically ticking boxes.

   - `references/security.md`
   - `references/architecture-scalability.md`
   - `references/reliability-maintainability.md`
   - `references/third-party-services.md` (Supabase-specific)

4. **For every issue found**, note: what it is, where it is (file/path), why it matters, how to fix it, and a severity (see below). Don't flag something as an issue just because it's on the checklist — if a "missing" pattern genuinely doesn't apply to this app, skip it rather than padding the report.

5. **Write the report** using the template below and save it as a Markdown file (e.g. `repo-audit-<date>.md`) in the outputs location. Present the file to the user rather than pasting the whole thing inline — the report is a deliverable they'll keep and reference, not a chat message.

## Severity levels

Use these consistently — they're what makes the report scannable and prioritizable:

- **High** — exploitable now, causes data loss/leakage, or will break in production under realistic conditions (e.g. missing Row Level Security, service-role key exposed to the browser, no error handling around a payment flow).
- **Medium** — not an immediate emergency, but a real problem that will cause pain soon or under moderate load/scale (e.g. N+1 queries, no rate limiting on auth, no tests around core logic).
- **Low** — worth fixing, but cosmetic, minor, or only matters at larger scale than the app currently operates at (e.g. inconsistent naming, missing JSDoc, a dependency that's a few minor versions behind).

## Report structure

ALWAYS use this exact template for the saved report:

```markdown
# Repo Audit: <project name>
Date: <date>
Scope: <which categories were audited>

## Summary
<3-5 sentences: overall health, and the 2-3 things to fix first>

## Findings by category

### Security
| Severity | Issue | Location | Fix |
|---|---|---|---|

### Architecture & Scalability
| Severity | Issue | Location | Fix |
|---|---|---|---|

### Reliability & Maintainability
| Severity | Issue | Location | Fix |
|---|---|---|---|

### Third-Party Services (Supabase)
| Severity | Issue | Location | Fix |
|---|---|---|---|

## Recommended order of fixes
1. <highest-impact High severity item>
2. ...
```

If a category has zero findings, keep the heading and write "No issues found" — this tells the user the area was actually checked, not skipped.

## Notes

- Never copy real secret values (API keys, service role keys, DB passwords) into the report, even redacted-looking ones — reference the variable name and file only (e.g. "`SUPABASE_SERVICE_ROLE_KEY` used in `app/api/upload/route.ts`").
- If the repo isn't actually Next.js + Supabase, still run the security/architecture/reliability checklists (they're mostly framework-agnostic) but skip the Supabase-specific checks in `references/third-party-services.md` and say so in the report's Scope line.
- Keep fixes concrete and specific to this codebase (file names, function names) rather than generic advice — that's the difference between a useful audit and a listicle.