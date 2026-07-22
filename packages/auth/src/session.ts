import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Profile, UserRole } from "@ecomstrait/db/types";
import { createClient } from "./server";

/** The current authenticated user, or null. Server-side. */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Require a session; redirect to `redirectTo` if absent. Returns the user. */
export async function requireUser(redirectTo = "/login"): Promise<User> {
  const user = await getUser();
  if (!user) redirect(redirectTo);
  return user;
}

/** Require the caller to hold a specific role; redirect otherwise. */
export async function requireRole(
  role: UserRole,
  redirectTo = "/dashboard",
): Promise<Profile> {
  const profile = await getProfile();
  if (!profile || profile.role !== role) redirect(redirectTo);
  return profile;
}

/** The current user's profile row (role, name), or null. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();
  return (data as Profile | null) ?? null;
}
