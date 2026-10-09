// Admin user-management Server Actions.
// Every action verifies the caller is an authenticated ADMIN before
// touching the service-role client, since the service role bypasses RLS.

"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserRole } from "@/lib/global";

const VALID_ROLES = new Set<string>([
  UserRole.ADMIN,
  UserRole.ASSISTANT,
  UserRole.SUPERVISOR,
]);

async function assertAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== UserRole.ADMIN) {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function createUserAction(input: {
  email: string;
  password: string;
  username: string;
  role: UserRole;
}): Promise<{ error?: string }> {
  await assertAdmin();

  if (!VALID_ROLES.has(input.role)) {
    return { error: "Invalid role" };
  }

  const admin = createAdminClient();

  const { data: created, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { username: input.username },
  });

  if (error || !created.user) {
    return { error: error?.message ?? "Failed to create user" };
  }

  // The handle_new_user trigger provisions the profile as ASSISTANT;
  // align it with the role the admin picked.
  const { error: profileError } = await admin
    .from("profiles")
    .update({ username: input.username, role: input.role })
    .eq("id", created.user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  return {};
}

export async function updateUserRoleAction(
  userId: string,
  role: UserRole
): Promise<{ error?: string }> {
  const caller = await assertAdmin();

  if (!VALID_ROLES.has(role)) {
    return { error: "Invalid role" };
  }

  if (caller.id === userId && role !== UserRole.ADMIN) {
    return { error: "You cannot demote your own admin account" };
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) {
    return { error: error.message };
  }

  return {};
}

export async function deleteUserAction(
  userId: string
): Promise<{ error?: string }> {
  const caller = await assertAdmin();

  if (caller.id === userId) {
    return { error: "You cannot delete your own account" };
  }

  const admin = createAdminClient();

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    return { error: error.message };
  }

  return {};
}
