-- ============================================================================
--  Founders Waitlist + lightweight analytics events for EcomStrait.
--  Same posture as the leads/newsletter tables: the app writes with the anon
--  (or service-role) key, RLS allows anonymous INSERTs only, no SELECT policy.
--  Read from the Supabase dashboard or with the service role.
-- ============================================================================

-- ---- Founders Waitlist -----------------------------------------------------
--  Captures the email plus the business context the visitor was exploring
--  (their idea, the matched niche, and which persona flow they came from) so
--  the drip sequence and future beta invites can be personalised.
create table if not exists public.waitlist_subscribers (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email      text not null unique,
  idea       text,
  niche      text,
  persona    text,
  source     text
);

create index if not exists waitlist_created_at_idx on public.waitlist_subscribers (created_at desc);

alter table public.waitlist_subscribers enable row level security;

drop policy if exists "waitlist_insert_anon" on public.waitlist_subscribers;
create policy "waitlist_insert_anon"
  on public.waitlist_subscribers
  for insert
  to anon, authenticated
  with check (true);

-- ---- Analytics events ------------------------------------------------------
--  Vendor-free funnel measurement: idea_submitted / build_clicked /
--  waitlist_joined (and any future event). `props` holds event-specific
--  context as JSON. Best-effort — the client never blocks on this.
create table if not exists public.analytics_events (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name       text not null,
  path       text,
  props      jsonb not null default '{}'::jsonb
);

create index if not exists analytics_events_created_at_idx on public.analytics_events (created_at desc);
create index if not exists analytics_events_name_idx on public.analytics_events (name);

alter table public.analytics_events enable row level security;

drop policy if exists "analytics_insert_anon" on public.analytics_events;
create policy "analytics_insert_anon"
  on public.analytics_events
  for insert
  to anon, authenticated
  with check (true);
