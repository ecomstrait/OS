"use server";

import { revalidatePath } from "next/cache";
import { getProfile } from "@ecomstrait/auth/session";
import { createAdminClient } from "@ecomstrait/db";
import type { UserRole } from "@ecomstrait/db/types";

/**
 * Verify the caller is an admin (via their session), then hand back the
 * service-role client. Admin operations span tenants, so they must bypass the
 * owner-scoped RLS — but only after the session role check passes.
 */
async function asAdmin() {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") return { error: "Forbidden." as const };
  const client = createAdminClient();
  if (!client) return { error: "Server is not configured." as const };
  return { client };
}

/** Change a user's platform role (admin-only). Guards against self-lockout. */
export async function setUserRole(
  userId: string,
  role: UserRole,
): Promise<{ error?: string }> {
  const a = await asAdmin();
  if ("error" in a) return a;

  const me = await getProfile();
  if (me && me.user_id === userId && role !== "admin") {
    return { error: "You can't remove your own admin role." };
  }

  const { error } = await a.client.from("profiles").update({ role }).eq("user_id", userId);
  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return {};
}

/** Seed a sample store-owner request for a supplier (until the merchant app exists). */
export async function createSampleRequest(supplierId: string): Promise<{ error?: string }> {
  const a = await asAdmin();
  if ("error" in a) return a;

  const { data: product } = await a.client
    .from("products")
    .select("id, title")
    .eq("supplier_id", supplierId)
    .limit(1)
    .maybeSingle();

  const { data: req, error } = await a.client
    .from("product_requests")
    .insert({
      supplier_id: supplierId,
      store_name: "Nova Boutique",
      store_owner_name: "Alex Rivera",
      store_owner_email: "alex@example.com",
      timeline: "Within 2 weeks",
      note: "Trialling demand for a new collection — keen to place a starter order.",
      status: "new",
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  await a.client.from("request_items").insert({
    request_id: req.id,
    product_id: product?.id ?? null,
    product_name: product?.title ?? "Sample product",
    quantity: 25,
  });
  await a.client.from("request_messages").insert({
    request_id: req.id,
    sender: "store_owner",
    body: "Hi! We'd love to stock this. What's your lead time for 25 units?",
  });

  revalidatePath(`/admin/suppliers/${supplierId}`);
  return {};
}

export async function approveSupplier(id: string): Promise<{ error?: string }> {
  const a = await asAdmin();
  if ("error" in a) return a;
  const now = new Date().toISOString();

  const { error } = await a.client.from("suppliers").update({ status: "approved" }).eq("id", id);
  if (error) return { error: error.message };

  await a.client.from("supplier_verification").upsert(
    {
      supplier_id: id,
      documents_verified_at: now,
      manual_reviewed_at: now,
      badge_granted_at: now,
    },
    { onConflict: "supplier_id" },
  );

  revalidatePath("/admin/suppliers");
  revalidatePath(`/admin/suppliers/${id}`);
  return {};
}

export async function rejectSupplier(id: string): Promise<{ error?: string }> {
  const a = await asAdmin();
  if ("error" in a) return a;

  const { error } = await a.client.from("suppliers").update({ status: "rejected" }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/suppliers");
  revalidatePath(`/admin/suppliers/${id}`);
  return {};
}

/** Manually mark the supplier's phone as verified (or clear it). */
export async function setPhoneVerified(
  id: string,
  verified: boolean,
): Promise<{ error?: string }> {
  const a = await asAdmin();
  if ("error" in a) return a;
  const { error } = await a.client.from("supplier_verification").upsert(
    { supplier_id: id, phone_verified_at: verified ? new Date().toISOString() : null },
    { onConflict: "supplier_id" },
  );
  if (error) return { error: error.message };
  revalidatePath(`/admin/suppliers/${id}`);
  return {};
}

/**
 * Store (or clear) the storefront password for a Shopify dev store. Dev stores
 * are password-locked; the assigned merchant reads this to preview their store.
 */
export async function setStorefrontPassword(
  shopifyStoreId: string,
  password: string,
): Promise<{ error?: string }> {
  const a = await asAdmin();
  if ("error" in a) return a;
  const value = password.trim();
  const { error } = await a.client
    .from("shopify_stores")
    .update({ storefront_password: value || null })
    .eq("id", shopifyStoreId);
  if (error) return { error: error.message };
  revalidatePath("/admin/shopify-stores");
  return {};
}

/** Send an application back for edits (e.g. request more info). */
export async function returnToPending(id: string): Promise<{ error?: string }> {
  const a = await asAdmin();
  if ("error" in a) return a;
  const { error } = await a.client
    .from("suppliers")
    .update({ status: "pending" })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/suppliers");
  revalidatePath(`/admin/suppliers/${id}`);
  return {};
}
