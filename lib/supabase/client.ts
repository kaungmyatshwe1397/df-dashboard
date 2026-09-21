// Supabase browser client — use in Client Components and browser context.
// Uses cookies for auth session via @supabase/ssr.

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase URL and API key are required. Check your .env.local file."
    );
  }

  return createBrowserClient(url, key);
}
