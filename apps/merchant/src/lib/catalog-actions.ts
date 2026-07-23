"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@ecomstrait/auth/server";

export async function addSelectedProduct(productId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };
  const { error } = await supabase
    .from("selected_products")
    .upsert({ user_id: user.id, product_id: productId }, { onConflict: "user_id,product_id", ignoreDuplicates: true });
  if (error) return { error: error.message };
  revalidatePath("/find-suppliers");
  revalidatePath("/inventory");
  return {};
}

export async function removeSelectedProduct(productId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };
  const { error } = await supabase
    .from("selected_products")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", productId);
  if (error) return { error: error.message };
  revalidatePath("/find-suppliers");
  revalidatePath("/inventory");
  return {};
}
