import { createClient } from "@ecomstrait/auth/server";
import type { SupplierStatus } from "@ecomstrait/db/types";

/**
 * Resolve the caller's Supabase client + their supplier (id + status), or an
 * error. Server-only helper shared by the data-mutating server actions.
 */
export async function getSupplierContext(): Promise<
  | { supabase: Awaited<ReturnType<typeof createClient>>; supplierId: string; status: SupplierStatus }
  | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };
  const { data } = await supabase
    .from("suppliers")
    .select("id, status")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!data) return { error: "Complete onboarding first." };
  return { supabase, supplierId: data.id, status: data.status };
}

/**
 * Like getSupplierContext, but requires the supplier to be approved. Used by
 * write actions (catalog, inventory) that are locked until verification.
 */
export async function requireApprovedSupplier() {
  const ctx = await getSupplierContext();
  if ("error" in ctx) return ctx;
  if (ctx.status !== "approved") {
    return { error: "Your account is pending approval — this unlocks once verified." };
  }
  return ctx;
}

/** The current user's supplier row (id + status), or null. For gating pages. */
export async function getMySupplier(): Promise<{ id: string; status: SupplierStatus } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("suppliers")
    .select("id, status")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  return data ?? null;
}
