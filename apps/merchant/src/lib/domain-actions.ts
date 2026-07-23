"use server";

import { promises as dns } from "node:dns";
import { revalidatePath } from "next/cache";
import { createClient } from "@ecomstrait/auth/server";
import type { StoreType } from "@ecomstrait/db";
import { domainTarget, isValidDomain, normalizeDomain } from "@/lib/domain";

type OwnStore = { id: string; type: StoreType; domain: string | null };

type OwnStoreResult =
  | { ok: false; error: string }
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; store: OwnStore };

/** Load the caller's store (owner-scoped) or return an error. */
async function ownStore(storeId: string): Promise<OwnStoreResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };
  const { data: store } = await supabase
    .from("stores")
    .select("id, type, domain")
    .eq("id", storeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!store) return { ok: false, error: "Store not found." };
  return { ok: true, supabase, store };
}

/** Save (or clear) a store's custom domain. */
export async function setStoreDomain(
  storeId: string,
  input: string,
): Promise<{ error?: string; domain?: string | null }> {
  const s = await ownStore(storeId);
  if (!s.ok) return { error: s.error };

  const raw = input.trim();
  if (!raw) {
    await s.supabase.from("stores").update({ domain: null }).eq("id", storeId);
    revalidatePath("/settings");
    return { domain: null };
  }
  const domain = normalizeDomain(raw);
  if (!isValidDomain(domain)) return { error: "Enter a valid domain, e.g. yourbrand.com" };

  const { error } = await s.supabase.from("stores").update({ domain }).eq("id", storeId);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { domain };
}

export type DomainCheck = {
  connected: boolean;
  resolvedA: string[];
  resolvedCname: string[];
  expectedA: string;
};

/** Live DNS lookup: does the domain point at the expected storefront host? */
export async function checkStoreDomain(storeId: string): Promise<DomainCheck | { error: string }> {
  const s = await ownStore(storeId);
  if (!s.ok) return { error: s.error };
  const domain = s.store.domain;
  if (!domain) return { error: "No domain set." };

  const target = domainTarget(s.store.type as StoreType);

  let resolvedA: string[] = [];
  let resolvedCname: string[] = [];
  try {
    resolvedA = await dns.resolve4(domain);
  } catch {
    /* apex may be a CNAME (flattened) or not yet propagated */
  }
  try {
    resolvedCname = await dns.resolveCname(`www.${domain}`);
  } catch {
    /* www may not be set yet */
  }

  const connected = resolvedA.includes(target.expectedA);
  return { connected, resolvedA, resolvedCname, expectedA: target.expectedA };
}
