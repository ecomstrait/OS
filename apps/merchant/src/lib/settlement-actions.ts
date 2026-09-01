"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@ecomstrait/auth/server";
import { createAdminClient } from "@ecomstrait/db";

/** Marks a settlement batch as paid (manual MVP — Docs/Credits-Settlement-Plan.md §4). */
export async function markSettlementBatchPaid(batchId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return { error: "Admin only." };

  const admin = createAdminClient();
  if (!admin) return { error: "Database isn't configured." };

  const { error } = await admin
    .from("settlement_batches")
    .update({ status: "paid", paid_at: new Date().toISOString(), paid_by: user.id })
    .eq("id", batchId);
  if (error) return { error: error.message };

  revalidatePath("/admin/settlements");
  return {};
}
