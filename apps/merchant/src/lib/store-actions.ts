"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@ecomstrait/auth/server";
import { createAdminClient } from "@ecomstrait/db";

/** Rename a store (owner-scoped). This is our platform label + the own-platform
 *  storefront name; the Shopify shop display name is set manually in Shopify. */
export async function setStoreName(
  storeId: string,
  name: string,
): Promise<{ error?: string; name?: string }> {
  const trimmed = name.trim();
  if (trimmed.length < 2) return { error: "Store name is too short." };
  if (trimmed.length > 60) return { error: "Keep the name under 60 characters." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("stores")
    .update({ name: trimmed })
    .eq("id", storeId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/stores");
  revalidatePath(`/store/${storeId}`);
  return { name: trimmed };
}

export type DeleteResult = {
  error?: string;
  /** What actually happened — a store with paid orders is archived, not erased. */
  outcome?: "deleted" | "archived";
  note?: string;
};

/**
 * Delete a store the merchant owns.
 *
 * `store_orders` cascades from `stores`, so hard-deleting a store that has
 * taken payments would erase its order history. Those stores are archived
 * instead: they leave the merchant's active list and stop serving, but the
 * records survive. Either way the linked Shopify dev store — a company asset —
 * goes back to the pool rather than being destroyed.
 */
export async function deleteStore(
  storeId: string,
  confirmName: string,
): Promise<DeleteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, shopify_store_id")
    .eq("id", storeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!store) return { error: "Store not found." };

  // Typing the name is the guard against a mis-click on an irreversible action.
  const expected = (store.name ?? "").trim().toLowerCase();
  if (confirmName.trim().toLowerCase() !== expected) {
    return { error: "That name doesn't match — type the store name exactly to confirm." };
  }

  const { count: orderCount } = await supabase
    .from("store_orders")
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId);

  // Release the dev store back to the available pool. Needs the service role:
  // merchants can read their assigned row but must not be able to write it.
  //
  // NEVER release a store that has already been handed over — it lives on the
  // merchant's own Shopify account now, and recycling it would hand their live
  // shop to a different merchant. The `.neq` makes that a database-level
  // condition rather than a check that can be skipped by a race.
  if (store.shopify_store_id) {
    const admin = createAdminClient();
    if (admin) {
      await admin
        .from("shopify_stores")
        .update({
          status: "available",
          owner_user_id: null,
          theme_id: null,
          sync_status: "released — merchant removed the store",
          transfer_email: null,
          transfer_requested_at: null,
        })
        .eq("id", store.shopify_store_id)
        .neq("status", "transferred");
    }
  }

  if ((orderCount ?? 0) > 0) {
    const { error } = await supabase
      .from("stores")
      .update({ status: "archived", shopify_store_id: null, live_url: null })
      .eq("id", storeId)
      .eq("user_id", user.id);
    if (error) return { error: error.message };

    revalidatePath("/stores");
    return {
      outcome: "archived",
      note: `Archived — this store has ${orderCount} paid order${orderCount === 1 ? "" : "s"}, so its records are kept.`,
    };
  }

  const { error } = await supabase
    .from("stores")
    .delete()
    .eq("id", storeId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/stores");
  revalidatePath("/find-suppliers");
  return { outcome: "deleted", note: "Store deleted." };
}

/**
 * "Make it yours" — the merchant has (or is creating) their own Shopify account
 * and wants this dev store moved onto it.
 *
 * Records the destination email and flags the store for an admin to action in
 * Shopify. Merchants can't do this themselves: the status must never be
 * self-servable to 'transferred'.
 */
export async function requestStoreTransfer(
  storeId: string,
  email: string,
): Promise<{ error?: string; note?: string }> {
  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return { error: "Enter the email address on your Shopify account." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, shopify_store_id")
    .eq("id", storeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!store) return { error: "Store not found." };
  if (!store.shopify_store_id) {
    return { error: "Provision this store on Shopify before requesting a transfer." };
  }

  const admin = createAdminClient();
  if (!admin) return { error: "Server not configured." };

  const { error } = await admin
    .from("shopify_stores")
    .update({
      status: "waiting_for_transfer",
      transfer_email: clean,
      transfer_requested_at: new Date().toISOString(),
    })
    .eq("id", store.shopify_store_id)
    .eq("owner_user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/stores");
  return {
    note: "Transfer requested. We'll move the store to your Shopify account and email you when it's done.",
  };
}
