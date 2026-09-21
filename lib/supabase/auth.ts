// Supabase auth helpers — signup, login, signout, session check.
// Wraps @supabase/ssr browser client for use in Client Components.

import { createClient } from "./client";
import { UserRole } from "@/lib/global";

export interface AuthError {
  message: string;
}

export async function signUpNewUser(data: {
  email: string;
  password: string;
  fullName: string;
}) {
  const supabase = createClient();

  const { data: result, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        username: data.fullName,
        role: UserRole.ASSISTANT,
      },
    },
  });

  return { data: result, error };
}

export async function signInWithCredentials(data: {
  email: string;
  password: string;
}) {
  const supabase = createClient();

  const { data: result, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  return { data: result, error };
}

export async function signOut() {
  const supabase = createClient();
  return supabase.auth.signOut();
}

export async function getUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
}

export async function getUserProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return data;
}
