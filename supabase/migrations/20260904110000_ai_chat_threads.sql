-- Persists the last 30 messages (plus a rolling summary) of every real
-- user-to-agent chat — merchant Co-Founder, supplier Co-Founder, and the
-- Store Builder chat — so returning to one actually continues it instead of
-- starting cold. Deliberately does NOT cover any agent-to-agent exchange
-- (e.g. Co-Founder delegating to the Business Advisor as a tool) — only
-- what the user actually typed and was shown.
--
-- Same posture as every other ai_* table (20260829120000_ai_native.sql,
-- 20260903110000_ai_snapshot_cache.sql): RLS enabled with no policies at
-- all. This is only ever touched via createAdminClient() from server-only
-- code, never from a browser session, so default-deny for anon/authenticated
-- is correct, not an oversight.
create table if not exists public.ai_chat_threads (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null,
  agent      text not null check (agent in ('merchant_cofounder', 'supplier_cofounder', 'merchant_builder')),
  -- The user's own id for a Co-Founder chat (one thread per whole portfolio);
  -- the store id for a Builder chat (one thread per store, spanning both the
  -- pre-launch draft conversation and the post-launch edit conversation,
  -- since a store keeps the same id across that promotion).
  thread_key text not null,
  -- ChatThreadMessage[] — {role, content, at?} — capped at 30 by application
  -- code (packages/ai/src/memory/chat-threads.ts), not enforced here.
  messages   jsonb not null default '[]',
  summary    text,
  updated_at timestamptz not null default now(),
  unique (tenant_id, agent, thread_key)
);

create index if not exists ai_chat_threads_tenant_idx on public.ai_chat_threads (tenant_id, agent);

alter table public.ai_chat_threads enable row level security;
