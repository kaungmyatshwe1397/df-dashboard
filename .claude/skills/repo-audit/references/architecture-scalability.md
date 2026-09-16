# Architecture & Scalability Checklist

Focus: does the structure make sense, and will it hold up as data and traffic grow — not just "does it work with today's test data."

## Server/Client component boundaries
Next.js App Router defaults to Server Components; `"use client"` should be added only where actually needed (state, browser APIs, event handlers).
- Look for `"use client"` on large components or whole pages where only a small interactive piece (a button, a form) actually needs it — this pushes unnecessary JS to the browser and loses server-rendering benefits.
- Look for data fetching happening in client components with `useEffect` when it could happen server-side — this causes loading spinners and waterfalls that a server component/Server Action would avoid.

## Data fetching patterns
- Check for fetch waterfalls: multiple sequential `await` calls to Supabase that don't depend on each other's results but run one after another instead of in parallel (`Promise.all`).
- Check for N+1 query patterns: fetching a list, then looping over it to fetch related data per-item, instead of a single joined Supabase query (`.select('*, related_table(*)')`).
- Check that caching/revalidation (`fetch` cache options, `revalidatePath`, `revalidateTag`, or route segment config) is used deliberately, not left at framework defaults without thought — either is fine, but it should look intentional given the data's freshness needs.

## Database design (Supabase/Postgres)
- Check that foreign keys and indexes exist on columns used in `WHERE`/`JOIN` clauses, especially any column used for RLS policies (an RLS policy without a matching index scans the whole table on every request).
- Check for pagination on any query that could return an unbounded number of rows (lists, feeds, admin tables) — `.range()` or `.limit()` usage.
- Flag heavy computation or aggregation done in application code that could be a database query/view instead, if it's operating on data that will grow.

## State and statelessness
- The app should not rely on in-memory state that wouldn't survive a serverless function restart or multiple instances running (e.g. an in-memory cache or queue used as if it were persistent) — Next.js API routes/Server Actions are typically stateless and can run on multiple instances.

## Media and assets
- Check `next/image` is used for images instead of raw `<img>` tags, for automatic optimization.
- Check large static assets aren't committed directly to the repo when they could be in Supabase Storage or a CDN.

## Structure and separation of concerns
- Check there's a consistent place for data-access logic (e.g. a `lib/supabase/` or `lib/data/` layer) rather than Supabase client calls scattered directly inside components with duplicated query logic.
- Note (don't over-flag) cases where business logic lives inside route handlers/components instead of being extracted — this matters more as the codebase grows, so weigh it as Medium/Low unless it's causing actual duplication already.