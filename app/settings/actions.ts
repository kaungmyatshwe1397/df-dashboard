// Authenticated account settings actions for the current user.

"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function updateOwnUsernameAction(
  username: string
): Promise<{ error?: string }> {
  const normalizedUsername = username.trim();
  if (normalizedUsername.length < 3) {
    return { error: "Username must be at least 3 characters" };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated" };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update({ username: normalizedUsername })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }
  if (!data) {
    return { error: "Your profile could not be updated" };
  }

  return {};
}
