"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@ecomstrait/auth/server";

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
