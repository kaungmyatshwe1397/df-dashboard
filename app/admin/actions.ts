"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Verify the caller is an authenticated admin. Returns the user or throws.
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

  if (profileError || !profile || profile.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function updateUserAction(
  userId: string,
  updates: { username?: string; password?: string }
): Promise<boolean> {
  await assertAdmin();

  const admin = createAdminClient();

  if (updates.password) {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: updates.password,
    });
    if (error) {
      console.error("Failed to update password:", error);
      return false;
    }
  }

  return true;
}

export async function deleteUserAction(userId: string): Promise<boolean> {
  await assertAdmin();

  const admin = createAdminClient();

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    console.error("Failed to delete user:", error);
    return false;
  }

  return true;
}
