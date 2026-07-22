import { createClient } from "@ecomstrait/auth/server";
import type { SupplierStatus } from "@ecomstrait/db/types";

type Resolved = { supplierId: string; status: SupplierStatus; isOwner: boolean };

async function resolve(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<Resolved | null> {
  const { data: owned } = await supabase
    .from("suppliers")
    .select("id, status")
    .eq("owner_user_id", userId)
    .maybeSingle();
  if (owned) return { supplierId: owned.id, status: owned.status, isOwner: true };

  const { data: member } = await supabase
    .from("supplier_members")
    .select("supplier_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (member) {
    const { data: s } = await supabase
      .from("suppliers")
      .select("id, status")
      .eq("id", member.supplier_id)
      .maybeSingle();
    if (s) return { supplierId: s.id, status: s.status, isOwner: false };
  }
  return null;
}

/**
 * Resolve the caller's Supabase client + their supplier (via ownership OR
 * active staff membership), or an error. Shared by the data-mutating actions.
 */
export async function getSupplierContext(): Promise<
  | { supabase: Awaited<ReturnType<typeof createClient>>; supplierId: string; status: SupplierStatus; isOwner: boolean }
  | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };
  const r = await resolve(supabase, user.id);
  if (!r) return { error: "Complete onboarding first." };
  return { supabase, ...r };
}

/** Like getSupplierContext, but requires the supplier to be approved. */
export async function requireApprovedSupplier() {
  const ctx = await getSupplierContext();
  if ("error" in ctx) return ctx;
  if (ctx.status !== "approved") {
    return { error: "Your account is pending approval — this unlocks once verified." };
  }
  return ctx;
}

/** The current user's supplier (id + status + isOwner), or null. For gating pages. */
export async function getMySupplier(): Promise<Resolved | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return resolve(supabase, user.id);
}
