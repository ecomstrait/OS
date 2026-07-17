import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Lazily-created Supabase client for our server-side API routes. Returns null
 * when env vars are missing so callers can degrade gracefully.
 *
 * Prefers the **service-role key** (server-only, never exposed to the browser):
 * these inserts run on the server, so the service role is the correct actor and
 * it bypasses RLS — avoiding "row violates row-level security policy" errors.
 * Falls back to the anon key (which then relies on the anon INSERT policy).
 */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!cached) {
    cached = createClient(url, key, { auth: { persistSession: false } });
  }
  return cached;
}
