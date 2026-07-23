-- ============================================================================
--  Entrepreneur (merchant) portal foundation — B0.
--  Subscriptions/plans, daily AI-token usage, the user's stores, and the
--  Shopify development-store pool (seeded manually by an admin). The
--  entrepreneur role reuses the existing `business_owner` enum value.
-- ============================================================================

do $$ begin
  create type public.plan_tier as enum ('free', 'basic', 'premium', 'full');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.subscription_status as enum
    ('trialing', 'active', 'past_due', 'canceled', 'incomplete');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.store_type as enum
    ('shopify_shopify_theme', 'shopify_liquid_theme', 'own_platform');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.store_status as enum
    ('draft', 'building', 'ready_for_review', 'live', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.shopify_store_status as enum
    ('available', 'assigned', 'building', 'ready_for_review',
     'client_approved', 'waiting_for_transfer', 'transferred', 'archived');
exception when duplicate_object then null; end $$;

-- ---- subscriptions (one per user) -----------------------------------------
create table if not exists public.subscriptions (
  user_id                uuid primary key references auth.users (id) on delete cascade,
  plan                   public.plan_tier not null default 'free',
  status                 public.subscription_status not null default 'active',
  stripe_customer_id     text,
  stripe_subscription_id text,
  current_period_end     timestamptz,
  trial_ends_at          timestamptz,
  promo_eligible         boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select to authenticated using (public.is_admin() or auth.uid() = user_id);

drop policy if exists "subscriptions_admin_all" on public.subscriptions;
create policy "subscriptions_admin_all" on public.subscriptions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop trigger if exists subscriptions_touch_updated_at on public.subscriptions;
create trigger subscriptions_touch_updated_at
  before update on public.subscriptions
  for each row execute function public.touch_updated_at();

-- ---- usage_daily (AI-token quota, one row per user per day) -----------------
create table if not exists public.usage_daily (
  user_id     uuid not null references auth.users (id) on delete cascade,
  day         date not null default current_date,
  tokens_used bigint not null default 0,
  primary key (user_id, day)
);

alter table public.usage_daily enable row level security;

drop policy if exists "usage_select_own" on public.usage_daily;
create policy "usage_select_own" on public.usage_daily
  for select to authenticated using (public.is_admin() or auth.uid() = user_id);

drop policy if exists "usage_write_own" on public.usage_daily;
create policy "usage_write_own" on public.usage_daily
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- shopify_stores (the development-store pool) ---------------------------
create table if not exists public.shopify_stores (
  id              uuid primary key default gen_random_uuid(),
  shop_domain     text not null unique,
  shopify_shop_id text,
  access_token    text,                       -- encrypted at rest (app layer)
  scopes          text,
  status          public.shopify_store_status not null default 'available',
  owner_user_id   uuid references auth.users (id) on delete set null,
  assigned_at     timestamptz,
  transferred_at  timestamptz,
  theme_id        text,
  sync_status     text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists shopify_stores_status_idx on public.shopify_stores (status);

alter table public.shopify_stores enable row level security;

-- Admins manage the pool; an assigned owner can read their own store.
drop policy if exists "shopify_stores_admin_all" on public.shopify_stores;
create policy "shopify_stores_admin_all" on public.shopify_stores
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "shopify_stores_owner_select" on public.shopify_stores;
create policy "shopify_stores_owner_select" on public.shopify_stores
  for select to authenticated using (auth.uid() = owner_user_id);

drop trigger if exists shopify_stores_touch_updated_at on public.shopify_stores;
create trigger shopify_stores_touch_updated_at
  before update on public.shopify_stores
  for each row execute function public.touch_updated_at();

-- ---- stores (a user's built store: Shopify or our own platform) ------------
create table if not exists public.stores (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  type              public.store_type not null,
  name              text,
  status            public.store_status not null default 'draft',
  domain            text,
  subdomain         text,
  theme             text,
  shopify_store_id  uuid references public.shopify_stores (id) on delete set null,
  live_url          text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists stores_user_idx on public.stores (user_id);

alter table public.stores enable row level security;

drop policy if exists "stores_owner_all" on public.stores;
create policy "stores_owner_all" on public.stores
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "stores_admin_all" on public.stores;
create policy "stores_admin_all" on public.stores
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop trigger if exists stores_touch_updated_at on public.stores;
create trigger stores_touch_updated_at
  before update on public.stores
  for each row execute function public.touch_updated_at();
