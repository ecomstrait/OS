-- ============================================================================
--  Orders (Doc 09). A request is an inquiry; accepting it creates an Order the
--  supplier fulfils. Orders have their own lifecycle: processing → shipped →
--  delivered (or cancelled). Access mirrors requests (owner + staff + admin).
-- ============================================================================

create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  number            bigint generated always as identity,
  supplier_id       uuid not null references public.suppliers (id) on delete cascade,
  request_id        uuid unique references public.product_requests (id) on delete set null,
  store_name        text,
  store_owner_name  text,
  store_owner_email text,
  status            text not null default 'processing',  -- processing|shipped|delivered|cancelled
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists orders_supplier_idx on public.orders (supplier_id, created_at desc);

alter table public.orders enable row level security;

drop policy if exists "orders_select" on public.orders;
create policy "orders_select" on public.orders
  for select to authenticated using (
    public.is_admin()
    or public.is_member(supplier_id)
    or exists (select 1 from public.suppliers s
               where s.id = supplier_id and s.owner_user_id = auth.uid())
  );

drop policy if exists "orders_write" on public.orders;
create policy "orders_write" on public.orders
  for all to authenticated
  using (
    public.is_admin()
    or public.is_member(supplier_id)
    or exists (select 1 from public.suppliers s
               where s.id = supplier_id and s.owner_user_id = auth.uid())
  )
  with check (
    public.is_admin()
    or public.is_member(supplier_id)
    or exists (select 1 from public.suppliers s
               where s.id = supplier_id and s.owner_user_id = auth.uid())
  );

drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.touch_updated_at();

-- ---- order line items ------------------------------------------------------
create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  product_id   uuid references public.products (id) on delete set null,
  product_name text not null,
  quantity     int not null default 1,
  unit_price   numeric(12, 2)
);

create index if not exists order_items_order_idx on public.order_items (order_id);

alter table public.order_items enable row level security;

drop policy if exists "order_items_access" on public.order_items;
create policy "order_items_access" on public.order_items
  for all to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (
        public.is_admin()
        or public.is_member(o.supplier_id)
        or exists (select 1 from public.suppliers s
                   where s.id = o.supplier_id and s.owner_user_id = auth.uid())
      )
    )
  )
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (
        public.is_admin()
        or public.is_member(o.supplier_id)
        or exists (select 1 from public.suppliers s
                   where s.id = o.supplier_id and s.owner_user_id = auth.uid())
      )
    )
  );
