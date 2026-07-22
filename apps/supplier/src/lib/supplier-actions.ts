"use server";

import { redirect } from "next/navigation";
import { createClient } from "@ecomstrait/auth/server";
import type { DocumentType } from "@ecomstrait/db/types";
import type { SupplierForm } from "@/lib/onboarding";

type SavePatch = Partial<SupplierForm> & { onboarding_step?: number };

/** Upsert the caller's supplier row with a partial patch. Returns the row id. */
export async function saveSupplier(
  patch: SavePatch,
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data, error } = await supabase
    .from("suppliers")
    .upsert({ owner_user_id: user.id, ...patch }, { onConflict: "owner_user_id" })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}

/** Record (or replace) an uploaded document of a given type. */
export async function recordDocument(input: {
  supplierId: string;
  type: DocumentType;
  storagePath: string;
}): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();

  await supabase
    .from("supplier_documents")
    .delete()
    .eq("supplier_id", input.supplierId)
    .eq("type", input.type);

  const { error } = await supabase.from("supplier_documents").insert({
    supplier_id: input.supplierId,
    type: input.type,
    storage_path: input.storagePath,
  });

  return error ? { error: error.message } : { ok: true };
}

/** Finalize onboarding: accept terms, move to review, seed verification. */
export async function submitOnboarding(input: {
  marketingOptIn: boolean;
}): Promise<{ error: string } | never> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const nowIso = new Date().toISOString();

  const { data: supplier, error } = await supabase
    .from("suppliers")
    .update({
      status: "in_review",
      onboarding_step: 5,
      marketing_opt_in: input.marketingOptIn,
      terms_accepted_at: nowIso,
    })
    .eq("owner_user_id", user.id)
    .select("id")
    .single();

  if (error || !supplier) return { error: error?.message ?? "No supplier found." };

  // Level 1 (email) is satisfied by Supabase's confirmed signup.
  await supabase.from("supplier_verification").upsert(
    { supplier_id: supplier.id, email_verified_at: user.email_confirmed_at ?? nowIso },
    { onConflict: "supplier_id" },
  );

  redirect("/dashboard?onboarded=1");
}
