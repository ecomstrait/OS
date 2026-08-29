-- AI-native foundation: RAG storage, agent-run audit trail, write-action
-- approvals, and per-model cost tracking. See Docs/AI-Native-Migration-Plan.md.
--
-- All four tables are service-role only — agents run server-side, never in
-- the browser, so there is no anon/authenticated policy to write, only RLS
-- enabled with no policies (default deny; service_role bypasses RLS).

create extension if not exists vector;

-- Sentinel tenant for shared content (e.g. the niche KB). A real NULL would
-- break the upsert below: Postgres treats NULL <> NULL, so ON CONFLICT never
-- matches an existing NULL-tenant row and every reseed would insert a
-- duplicate instead of updating. A fixed UUID keeps the unique constraint —
-- and therefore the upsert — simple and correct.
-- '@ecomstrait/ai' exports this same value as GLOBAL_TENANT_ID; keep both in sync.

create table ai_embeddings (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null default '00000000-0000-0000-0000-000000000000',
  source_type  text not null,           -- 'niche_kb' | 'store_catalog' | 'supplier_doc' | 'conversation'
  source_id    text not null,
  content      text not null,
  -- 1536 dims: verified against the live gateway's "embeddings" role response,
  -- not assumed from a vendor's published spec. Re-run that check before
  -- changing this if the embeddings model behind the role ever changes.
  embedding    vector(1536) not null,
  provider     text not null,           -- resolved model alias at embed time
  created_at   timestamptz not null default now(),
  unique (tenant_id, source_type, source_id)
);
create index ai_embeddings_vector_idx on ai_embeddings
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index ai_embeddings_source_idx on ai_embeddings (source_type, tenant_id);

create table ai_agent_runs (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null,
  agent       text not null,             -- 'business-advisor' | 'analytics-agent' | ...
  thread_id   uuid not null,
  status      text not null default 'running', -- running | done | failed | awaiting_approval
  input       jsonb not null,
  output      jsonb,
  tool_calls  jsonb not null default '[]',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index ai_agent_runs_thread_idx on ai_agent_runs (thread_id);
create index ai_agent_runs_tenant_idx on ai_agent_runs (tenant_id);

create table ai_approvals (
  id            uuid primary key default gen_random_uuid(),
  agent_run_id  uuid not null references ai_agent_runs(id),
  action        text not null,           -- e.g. 'shopify.publish_theme'
  payload       jsonb not null,
  status        text not null default 'pending', -- pending | approved | rejected
  approved_by   uuid,
  created_at    timestamptz not null default now(),
  resolved_at   timestamptz
);
create index ai_approvals_status_idx on ai_approvals (status);

create table ai_cost_ledger (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null,
  role           text not null,          -- reasoning | workhorse | fast-cheap | embeddings
  model          text not null,          -- resolved alias, for per-model cost comparison
  input_tokens   integer not null,
  output_tokens  integer not null,
  cost_usd       numeric(10,4) not null,
  created_at     timestamptz not null default now()
);
create index ai_cost_ledger_tenant_idx on ai_cost_ledger (tenant_id, created_at);

alter table ai_embeddings enable row level security;
alter table ai_agent_runs enable row level security;
alter table ai_approvals enable row level security;
alter table ai_cost_ledger enable row level security;

-- Cosine-similarity search over ai_embeddings, callable via
-- `client.rpc("match_ai_embeddings", {...})`. `security definer` so it can
-- run under the service-role client despite RLS being enabled with no
-- policies on the underlying table.
--
-- Tenant scoping: pass `match_tenant_id` to blend that tenant's own content
-- with the shared/global KB (tenant_id = the sentinel above). Leaving it null
-- searches with NO tenant filter at all — only safe when `match_source_type`
-- already scopes to shared content (e.g. 'niche_kb'). A caller querying
-- tenant-owned content (store catalogs, conversations) must always pass
-- `match_tenant_id`.
create or replace function match_ai_embeddings(
  query_embedding vector(1536),
  match_source_type text default null,
  match_tenant_id uuid default null,
  match_count int default 5
)
returns table (
  id uuid,
  source_type text,
  source_id text,
  content text,
  similarity float
)
language sql stable security definer
set search_path = public
as $$
  select
    e.id,
    e.source_type,
    e.source_id,
    e.content,
    1 - (e.embedding <=> query_embedding) as similarity
  from ai_embeddings e
  where (match_source_type is null or e.source_type = match_source_type)
    and (
      match_tenant_id is null
      or e.tenant_id = match_tenant_id
      or e.tenant_id = '00000000-0000-0000-0000-000000000000'
    )
  order by e.embedding <=> query_embedding
  limit match_count;
$$;
