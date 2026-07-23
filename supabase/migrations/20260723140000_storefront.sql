-- ============================================================================
--  Own-platform storefront (B4). A launched store keeps its generated content
--  and product list; customer orders are recorded and routed to suppliers.
-- ============================================================================

-- The generated store plan (hero, colors, about, collections, SEO).
alter table public.stores add column if not exists content jsonb not null default '{}';

-- Customer shipping address on supplier orders (supplier ships to the customer).
alter table public.orders add column if not exists shipping text;

-- ---- store_products (the store's catalog) ----------------------------------
create table if not exists public.store_products (
  store_id   uuid not null references public.stores (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  price      numeric(12, 2),
  created_at timestamptz not null default now(),
  primary key (store_id, product_id)
);

alter table public.store_products enable row level security;

drop policy if exists "store_products_owner" on public.store_products;
create policy "store_products_owner" on public.store_products
  for all to authenticated
  using (exists (select 1 from public.stores s where s.id = store_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.stores s where s.id = store_id and s.user_id = auth.uid()));

-- ---- store_orders (customer purchases on a storefront) ----------------------
create table if not exists public.store_orders (
  id                uuid primary key default gen_random_uuid(),
  store_id          uuid not null references public.stores (id) on delete cascade,
  customer_name     text,
  customer_email    text,
  shipping          text,
  subtotal          numeric(12, 2),
  items             jsonb not null default '[]',   -- [{product_id, supplier_id, name, quantity, unit_price}]
  status            text not null default 'paid',   -- paid | fulfilled | refunded
  stripe_session_id text unique,
  created_at        timestamptz not null default now()
);

create index if not exists store_orders_store_idx on public.store_orders (store_id, created_at desc);

alter table public.store_orders enable row level security;

drop policy if exists "store_orders_owner_select" on public.store_orders;
create policy "store_orders_owner_select" on public.store_orders
  for select to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.stores s where s.id = store_id and s.user_id = auth.uid())
  );
-- Inserts happen via the service role (checkout success handler).
