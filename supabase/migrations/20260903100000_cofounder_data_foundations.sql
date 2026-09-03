-- Foundations for the Co-Founder AI overhaul (Docs/prompts + the AI
-- architecture): a real `customers` profile table and a per-order traffic-
-- source event, both marked `is_synthetic` because neither has a real data
-- source yet — every order synthesizes a plausible value for both so the
-- co-founder always has something to reason over. `is_synthetic` is the
-- seam: real tracking work later just starts inserting `is_synthetic =
-- false` rows and nothing downstream (the snapshot, the advisor) has to
-- change.

create table if not exists public.customers (
  id              uuid primary key default gen_random_uuid(),
  store_id        uuid not null references public.stores (id) on delete cascade,
  email           text,
  name            text,
  first_order_at  timestamptz not null default now(),
  last_order_at   timestamptz not null default now(),
  order_count     integer not null default 1,
  lifetime_value  numeric not null default 0,
  is_synthetic    boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- One profile per (store, email) — a repeat customer updates the same row
-- rather than creating a new one each order. A customer with no email
-- (rare — cash-on-delivery orders sometimes lack one) never dedupes, which
-- is fine: they just show up as several single-order profiles.
create unique index if not exists customers_store_email_idx
  on public.customers (store_id, email) where email is not null;

drop trigger if exists customers_touch_updated_at on public.customers;
create trigger customers_touch_updated_at
  before update on public.customers
  for each row execute function public.touch_updated_at();

alter table public.customers enable row level security;

drop policy if exists "customers_owner_all" on public.customers;
create policy "customers_owner_all" on public.customers
  for all to authenticated
  using (exists (select 1 from public.stores s where s.id = customers.store_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.stores s where s.id = customers.store_id and s.user_id = auth.uid()));

drop policy if exists "customers_admin_all" on public.customers;
create policy "customers_admin_all" on public.customers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- One row per order, not per pageview — real traffic tracking would be a
-- click/session-level event; this is a coarser "the order that came in was
-- probably from X" stand-in, real-shaped so a genuine tracking pipeline can
-- slot in later without a schema change.
create table if not exists public.store_traffic_events (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores (id) on delete cascade,
  order_id     uuid references public.store_orders (id) on delete set null,
  source       text not null check (source in ('organic_search', 'paid_search', 'social', 'direct', 'referral', 'email')),
  is_synthetic boolean not null default true,
  created_at   timestamptz not null default now()
);

create index if not exists store_traffic_events_store_idx on public.store_traffic_events (store_id, created_at desc);

alter table public.store_traffic_events enable row level security;

drop policy if exists "store_traffic_events_owner_all" on public.store_traffic_events;
create policy "store_traffic_events_owner_all" on public.store_traffic_events
  for all to authenticated
  using (exists (select 1 from public.stores s where s.id = store_traffic_events.store_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.stores s where s.id = store_traffic_events.store_id and s.user_id = auth.uid()));

drop policy if exists "store_traffic_events_admin_all" on public.store_traffic_events;
create policy "store_traffic_events_admin_all" on public.store_traffic_events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
