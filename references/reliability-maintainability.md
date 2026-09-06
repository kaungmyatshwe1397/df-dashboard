# Reliability & Maintainability Checklist

Focus: does it fail gracefully when things go wrong, and can someone other than the original author safely change it later.

## Error handling
- Server Actions and Route Handlers that call Supabase should check for and handle the `error` object Supabase returns (it doesn't throw by default) — a missed `error` check means failures silently proceed as if they succeeded.
- Check for `error.tsx` / `global-error.tsx` files (App Router error boundaries) so unexpected errors show a real page instead of a blank screen or default stack trace.
- Check for `loading.tsx` or explicit loading states around data fetching so slow requests don't look like a frozen app.
- External calls (Supabase, any other API) that can time out or fail intermittently should have basic retry/backoff or at least a clear user-facing failure state — not just an unhandled rejection.

## Observability
- Check for any logging or error-tracking setup (even basic `console.error` in the right places, or a service like Sentry) — with nothing at all, production issues are invisible until a user reports them.
- Check that logs/error reports don't include sensitive data (full user objects, tokens, request bodies with passwords).

## Testing
- Check for a test setup at all (`__tests__`, `*.test.ts`, Playwright/Cypress config, `vitest`/`jest` config).
- Weigh this by what the app does — a small side project with no tests is a Low/Medium note, but an app handling payments, auth, or user data with zero tests around that logic is Medium/High.
- If tests exist, spot-check that they test actual logic/behavior rather than only trivial snapshot/render tests.

## Type safety
- Check `tsconfig.json` has `strict: true` (or close to it). Loosely-typed TypeScript (heavy `any` usage, `strict: false`) gives a false sense of safety.
- Grep for `any` usage — a handful is normal, but widespread `any` on data coming from Supabase queries means type errors won't be caught until runtime.

## Code health
- Check for a linter/formatter config (ESLint, Prettier) and that it's actually enforced (a `lint` script, ideally run in CI or a pre-commit hook) — config that exists but isn't run doesn't help.
- Look for obvious duplication: the same Supabase query or the same validation logic copy-pasted across multiple files instead of shared.
- Check the README explains how to run the project locally, including required environment variables (names, not values) — missing setup docs is a real maintainability cost for anyone joining later, including future-you.

## CI/CD
- Check for a CI config (`.github/workflows/`, etc.) that at least runs lint/build/tests on push or PR. Without this, broken code can reach production before anyone notices.