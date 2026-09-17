# Security Checklist

Focus: could someone read, modify, or delete data they shouldn't; or take over an account or the server.

## Supabase Row Level Security (RLS)
The most common and most serious Next.js + Supabase mistake: relying on client-side checks instead of RLS. If RLS is off or missing policies on a table, anyone with the anon key (which is public, visible in the browser) can read/write that table directly through the Supabase API, regardless of what the UI does.
- Check every table for RLS enabled (`supabase/migrations/*.sql` for `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, or check via the Supabase dashboard export if included).
- Check that policies actually restrict by user (e.g. `auth.uid() = user_id`) rather than being wide-open (`USING (true)`) "temporarily" — these are frequently never tightened.
- Flag any table with no policies at all as High severity, since RLS-enabled-but-no-policies blocks all access (breaks functionality) while RLS-disabled allows all access (security hole) — both are real bugs.

## Secret and key handling
- `SUPABASE_SERVICE_ROLE_KEY` (or any key that bypasses RLS) must only appear in server-side code (Server Actions, Route Handlers, server components) — never in a file that could ship to the browser. Search for it in any file under `app/**/page.tsx`, `app/**/*client*`, or anything with `"use client"` at the top.
- `.env`, `.env.local` should be in `.gitignore`. Check `git log` isn't tracking them and they aren't committed.
- Only `NEXT_PUBLIC_*` prefixed variables should be used in client components — anything else used client-side is either a bug or a leak.

## Auth
- Protected routes/pages must check the session server-side (middleware, server component, or Route Handler), not only redirect client-side after the page has already rendered — a client-only check can be bypassed or briefly flash protected content.
- Sign-out should invalidate the session server-side, not just clear local state.
- Password reset / magic link flows: check tokens are single-use and expire.

## Input handling
- Server Actions and API routes (Route Handlers) that accept user input should validate it (type, shape, length) before using it in a query or passing it to Supabase — untrusted input reaching a query builder is how injection-adjacent bugs happen even with an ORM-like client.
- Check for `dangerouslySetInnerHTML` usage — if present, confirm the content is sanitized or comes from a trusted source, not user input.
- File uploads (to Supabase Storage or elsewhere): check file type/size are validated server-side, not just in the upload widget.

## Rate limiting & abuse
- Auth endpoints (sign-up, sign-in, password reset) and any expensive Server Action/API route should have some rate limiting or abuse protection — Supabase Auth has built-in limits, but custom endpoints usually don't.

## Headers & transport
- `next.config.js` should set security headers where relevant (e.g. `Content-Security-Policy`, `X-Frame-Options`) — note as Low/Medium if entirely absent, not automatically High, since impact depends on the app.
- Confirm the app is served over HTTPS in production (usually handled by the host, but worth a one-line confirmation).

## Dependencies
- Run or check for recent `npm audit` results. Flag any High/Critical advisories on direct dependencies.
- Check the lockfile is committed (`package-lock.json`, `pnpm-lock.yaml`, or `yarn.lock`).