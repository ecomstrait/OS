-- Read-through cache for the Co-Founder's business snapshot (revenue/order
-- aggregation is real work, and every chat message was recomputing it from
-- scratch). TTL-checked in code, not here — unlike store_category_content's
-- forever-cache, this data changes constantly, so a fixed freshness window
-- (see snapshot-cache.ts) decides staleness, not "does a row exist."
--
-- Same posture as the other ai_* tables in 20260829120000_ai_native.sql:
-- RLS enabled with no policies at all. This is only ever touched via
-- createAdminClient() from server-only code, never from a browser session,
-- so default-deny for anon/authenticated is correct, not an oversight.
create table if not exists public.ai_snapshot_cache (
  id            uuid primary key default gen_random_uuid(),
  subject_type  text not null check (subject_type in ('merchant', 'supplier')),
  subject_id    uuid not null,
  snapshot_json jsonb not null,
  computed_at   timestamptz not null default now(),
  unique (subject_type, subject_id)
);

alter table public.ai_snapshot_cache enable row level security;
