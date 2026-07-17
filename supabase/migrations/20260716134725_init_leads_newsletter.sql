-- ============================================================================
--  Lead capture + newsletter storage for EcomStrait forms.
--  The app writes with the public anon key, so RLS allows anonymous INSERTs
--  only. There is no SELECT policy — tables are write-only from the browser;
--  read submissions from the Supabase dashboard or with the service role.
-- ============================================================================

-- ---- Leads (contact, supplier applications, store consultations) -----------
create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  form_name  text not null default 'lead',
  name       text,
  email      text not null,
  page       text,
  payload    jsonb not null default '{}'::jsonb
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_form_name_idx on public.leads (form_name);

alter table public.leads enable row level security;

drop policy if exists "leads_insert_anon" on public.leads;
create policy "leads_insert_anon"
  on public.leads
  for insert
  to anon, authenticated
  with check (true);

-- ---- Newsletter subscribers ------------------------------------------------
create table if not exists public.newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email      text not null unique,
  source     text
);

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "newsletter_insert_anon" on public.newsletter_subscribers;
create policy "newsletter_insert_anon"
  on public.newsletter_subscribers
  for insert
  to anon, authenticated
  with check (true);
