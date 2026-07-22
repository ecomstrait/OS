-- ============================================================================
--  Product requests (Doc 09): store owners ask a supplier to fulfil products.
--  A request has line items and a message thread. Suppliers accept / decline /
--  propose / fulfil and reply. Until the merchant app exists, requests are
--  seeded by an admin (or the service role).
-- ============================================================================

create table if not exists public.product_requests (
  id               uuid primary key default gen_random_uuid(),
  supplier_id      uuid not null references public.suppliers (id) on delete cascade,
  store_name       text,
  store_owner_name text,
  store_owner_email text,
  timeline         text,
  note             text,
  status           text not null default 'new',  -- new|accepted|declined|proposed|fulfilled
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists product_requests_supplier_idx
  on public.product_requests (supplier_id, created_at desc);

alter table public.product_requests enable row level security;

drop policy if exists "requests_select_own" on public.product_requests;
create policy "requests_select_own" on public.product_requests
  for select to authenticated using (
    public.is_admin()
    or exists (select 1 from public.suppliers s
               where s.id = supplier_id and s.owner_user_id = auth.uid())
  );

drop policy if exists "requests_update_own" on public.product_requests;
create policy "requests_update_own" on public.product_requests
  for update to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.suppliers s
               where s.id = supplier_id and s.owner_user_id = auth.uid())
  )
  with check (
    public.is_admin()
    or exists (select 1 from public.suppliers s
               where s.id = supplier_id and s.owner_user_id = auth.uid())
  );

drop policy if exists "requests_insert_admin" on public.product_requests;
create policy "requests_insert_admin" on public.product_requests
  for insert to authenticated with check (public.is_admin());

drop trigger if exists product_requests_touch_updated_at on public.product_requests;
create trigger product_requests_touch_updated_at
  before update on public.product_requests
  for each row execute function public.touch_updated_at();

-- ---- line items ------------------------------------------------------------
create table if not exists public.request_items (
  id           uuid primary key default gen_random_uuid(),
  request_id   uuid not null references public.product_requests (id) on delete cascade,
  product_id   uuid references public.products (id) on delete set null,
  product_name text not null,
  quantity     int not null default 1
);

create index if not exists request_items_request_idx on public.request_items (request_id);

alter table public.request_items enable row level security;

drop policy if exists "request_items_select_own" on public.request_items;
create policy "request_items_select_own" on public.request_items
  for select to authenticated using (
    public.is_admin()
    or exists (
      select 1 from public.product_requests r
      join public.suppliers s on s.id = r.supplier_id
      where r.id = request_id and s.owner_user_id = auth.uid()
    )
  );

drop policy if exists "request_items_insert_admin" on public.request_items;
create policy "request_items_insert_admin" on public.request_items
  for insert to authenticated with check (public.is_admin());

-- ---- message thread --------------------------------------------------------
create table if not exists public.request_messages (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.product_requests (id) on delete cascade,
  sender     text not null,   -- supplier|store_owner|system
  body       text not null,
  created_at timestamptz not null default now()
);

create index if not exists request_messages_request_idx
  on public.request_messages (request_id, created_at);

alter table public.request_messages enable row level security;

drop policy if exists "request_messages_select_own" on public.request_messages;
create policy "request_messages_select_own" on public.request_messages
  for select to authenticated using (
    public.is_admin()
    or exists (
      select 1 from public.product_requests r
      join public.suppliers s on s.id = r.supplier_id
      where r.id = request_id and s.owner_user_id = auth.uid()
    )
  );

drop policy if exists "request_messages_insert_own" on public.request_messages;
create policy "request_messages_insert_own" on public.request_messages
  for insert to authenticated with check (
    public.is_admin()
    or exists (
      select 1 from public.product_requests r
      join public.suppliers s on s.id = r.supplier_id
      where r.id = request_id and s.owner_user_id = auth.uid()
    )
  );
