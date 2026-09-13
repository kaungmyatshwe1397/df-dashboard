"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { User, UserRole } from "@/lib/global";

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

export async function createUserAction(userData: {
  email: string;
  username: string;
  password: string;
  role: UserRole;
}): Promise<{ error: string | null; user: User | null }> {
  try {
    await assertAdmin();
  } catch {
    return { error: "Unauthorized. Admin access required.", user: null };
  }

  const admin = createAdminClient();

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true,
    user_metadata: { username: userData.username, role: userData.role },
  });

  if (authError) {
    const message = authError.message.includes("already")
      ? "Email is already registered."
      : authError.message.includes("password")
        ? "Password does not meet requirements."
        : "Failed to create user. Please try again.";
    return { error: message, user: null };
  }

  if (!authData.user) {
    return { error: "Failed to create user. Please try again.", user: null };
  }

  const newUser: User = {
    id: authData.user.id,
    email: userData.email,
    username: userData.username,
    password_hash: "",
    role: userData.role,
  };

  return { error: null, user: newUser };
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

// ------------------------------------------
// Orphan Detection
// ------------------------------------------
// Finds auth users who have no matching profile in the profiles table.
// An orphan means: user exists in Supabase Auth but was never inserted
// into profiles (e.g. failed signup, partial failure, or manual deletion).

export interface OrphanedUser {
  id: string;
  email: string;
}

export async function checkOrphanedUsers(): Promise<{
  error: string | null;
  orphans: OrphanedUser[];
}> {
  try {
    await assertAdmin();
  } catch {
    return { error: "Unauthorized. Admin access required.", orphans: [] };
  }

  const admin = createAdminClient();

  const { data: authData, error: authError } = await admin.auth.admin.listUsers();
  if (authError || !authData) {
    return { error: authError?.message ?? "Failed to list auth users.", orphans: [] };
  }

  const supabase = await createClient();
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id");

  if (profileError || !profiles) {
    return { error: profileError?.message ?? "Failed to list profiles.", orphans: [] };
  }

  const profileIds = new Set(profiles.map((p) => p.id));
  const orphans = authData.users
    .filter((u) => !profileIds.has(u.id))
    .map((u) => ({ id: u.id, email: u.email ?? "unknown" }));

  return { error: null, orphans };
}

export async function deleteOrphanedAuthUser(userId: string): Promise<boolean> {
  try {
    await assertAdmin();
  } catch {
    return false;
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    console.error("Failed to delete orphaned auth user:", error);
    return false;
  }

  return true;
}
