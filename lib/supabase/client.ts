// Supabase browser client — use in Client Components and browser context.
// Uses cookies for auth session via @supabase/ssr.

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    const missing = [
      !url && "NEXT_PUBLIC_SUPABASE_URL",
      !key && "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    ].filter(Boolean).join(", ");
    throw new Error(
      `Missing Supabase configuration: ${missing}. Set these in .env.local at the project root and restart Next.js.`
    );
  }

  return createBrowserClient(url, key);
}
