import { NextResponse } from "next/server";
import { createClient } from "@ecomstrait/auth/server";
import {
  r2Configured,
  uploadToR2,
  validateUpload,
  deleteFromProvider,
  type MediaKind,
} from "@/lib/media";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * The store media library.
 *
 * A route rather than a server action because these carry files — video in
 * particular — and a route streams multipart bodies without the action
 * serialisation limits.
 *
 * Every method re-checks store ownership against the session. RLS already
 * covers `store_assets`, but the upload itself happens before any insert, so
 * without an explicit check anyone signed in could push files at someone
 * else's store folder.
 */

async function ownedStore(storeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." as const, status: 401 };

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("id", storeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!store) return { error: "Store not found." as const, status: 404 };

  return { supabase, user, storeId };
}

/** List a store's media, newest first. */
export async function GET(req: Request) {
  const storeId = new URL(req.url).searchParams.get("storeId")?.trim();
  if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });

  const ctx = await ownedStore(storeId);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { data } = await ctx.supabase
    .from("store_assets")
    .select("id, kind, provider, url, file_name, width, height, bytes, role, alt, created_at")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ assets: data ?? [] });
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected a file upload." }, { status: 400 });
  }

  const storeId = String(form.get("storeId") ?? "").trim();
  const file = form.get("file");
  const kind: MediaKind = form.get("kind") === "video" ? "video" : "image";
  const role = String(form.get("role") ?? "").trim() || null;

  if (!storeId || !(file instanceof File)) {
    return NextResponse.json({ error: "storeId and file are required." }, { status: 400 });
  }

  const ctx = await ownedStore(storeId);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const check = validateUpload(kind, file.type, file.size);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

  // Foldered by user then store: the Supabase fallback's RLS keys off the first
  // path segment being the uid, and R2 gets the same shape for free.
  const safeName = (file.name || "asset").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const path = `${ctx.user.id}/${storeId}/${Date.now()}-${safeName}`;
  let uploaded;

  if (r2Configured()) {
    const res = await uploadToR2(file, path);
    if ("error" in res) return NextResponse.json({ error: res.error }, { status: 502 });
    uploaded = res;
  } else {
    const { error } = await ctx.supabase.storage
      .from("store-assets")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (error) return NextResponse.json({ error: error.message }, { status: 502 });

    uploaded = {
      provider: "supabase" as const,
      url: ctx.supabase.storage.from("store-assets").getPublicUrl(path).data.publicUrl,
      externalId: path,
      width: null,
      height: null,
      bytes: file.size,
    };
  }

  const { data: asset, error: insErr } = await ctx.supabase
    .from("store_assets")
    .insert({
      store_id: storeId,
      user_id: ctx.user.id,
      kind,
      provider: uploaded.provider,
      url: uploaded.url,
      external_id: uploaded.externalId,
      file_name: file.name || null,
      mime_type: file.type || null,
      bytes: uploaded.bytes,
      width: uploaded.width,
      height: uploaded.height,
      role,
    })
    .select("id, kind, provider, url, file_name, width, height, bytes, role, alt, created_at")
    .single();

  if (insErr) {
    // The bytes landed but the index row didn't — tell the truth rather than
    // reporting a success the library won't be able to show.
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ asset });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const assetId = url.searchParams.get("assetId")?.trim();
  const storeId = url.searchParams.get("storeId")?.trim();
  if (!assetId || !storeId) {
    return NextResponse.json({ error: "assetId and storeId required" }, { status: 400 });
  }

  const ctx = await ownedStore(storeId);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { data: asset } = await ctx.supabase
    .from("store_assets")
    .select("id, provider, external_id")
    .eq("id", assetId)
    .eq("store_id", storeId)
    .maybeSingle();
  if (!asset) return NextResponse.json({ error: "Asset not found." }, { status: 404 });

  // Remote first: the row is the only record of where the bytes live, so
  // deleting it first would strand the file permanently.
  if (asset.provider === "supabase" && asset.external_id) {
    await ctx.supabase.storage.from("store-assets").remove([asset.external_id]);
  } else {
    await deleteFromProvider(asset.provider, asset.external_id);
  }

  const { error } = await ctx.supabase.from("store_assets").delete().eq("id", assetId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: true });
}
