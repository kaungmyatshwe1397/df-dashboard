# Third-Party Service Usage Checklist (Supabase)

Focus: is Supabase (and any other third-party service) wired up in a way that's safe and won't cause surprises — separate from the general security/architecture checks, because Supabase has a few specific footguns.

## Client setup
- There should be a clear separation between the browser client (uses the anon key, safe to expose) and the server/admin client (uses the service role key, must stay server-only). Look for something like `lib/supabase/client.ts` (browser) vs `lib/supabase/server.ts` (server) rather than one client used everywhere.
- Check the browser client is created fresh per-request in Server Components (Supabase's SSR helpers require this) rather than reused as a singleton across requests, which can leak one user's session/data into another's request in a serverless environment.

## Migrations
- Check for a `supabase/migrations/` folder that's version-controlled, rather than schema changes made only through the Supabase dashboard with no local record. Undocumented dashboard-only changes mean the schema can't be reproduced or rolled back.
- Check migrations are applied in order and there's no drift between what's in the repo and what's likely running (this is hard to verify fully without dashboard access — note it as a manual follow-up if you can't confirm).

## Realtime
- If Supabase Realtime subscriptions are used (`.channel(...)`, `.on('postgres_changes', ...)`), check that components unsubscribe on unmount (cleanup function in `useEffect`) — unclosed subscriptions leak connections and can cause duplicate event handling.

## Storage
- Supabase Storage buckets should have their own access policies (public vs private buckets set deliberately, not all public by default).
- Uploaded file paths should be namespaced per user (e.g. `userId/filename`) so storage-level RLS policies can actually restrict access per user.

## Auth configuration
- Check redirect URLs / allowed origins for Supabase Auth are limited to the app's actual domains (this is usually dashboard config, not code — note as a manual check if not visible in the repo).
- If using third-party OAuth providers through Supabase Auth, check the callback route validates state correctly (usually handled by Supabase's SSR helpers — flag if a custom implementation skips this).

## Failure handling for the service itself
- Supabase (or any third-party API) can be slow or briefly unavailable — check that a Supabase outage/timeout doesn't crash the whole app (unhandled promise rejection) but instead shows a reasonable error state.
- If there are other third-party services (payment provider, email service, analytics), apply the same pattern: check API keys are server-side only where they should be, and check for basic error handling around each call rather than assuming the service never fails.

## Cost/quota awareness
- Note (Low severity, informational) any pattern that could cause unexpectedly high usage — e.g. fetching entire tables repeatedly, no caching on expensive queries, or Realtime subscriptions left open longer than needed — since Supabase usage-based billing means inefficiency has a direct cost, not just a performance one.