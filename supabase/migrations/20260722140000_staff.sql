-- ============================================================================
--  Supplier Staff (Doc 14). An owner can invite teammates who then access the
--  same supplier's portal. Membership is modelled in supplier_members; access
--  is granted via ADDITIVE staff RLS policies (existing owner policies stay).
-- ============================================================================

create table if not exists public.supplier_members (
  id            uuid primary key default gen_random_uuid(),
  supplier_id   uuid not null references public.suppliers (id) on delete cascade,
  user_id       uuid references auth.users (id) on delete cascade,
  invited_email text not null,
  role          public.user_role not null default 'supplier_staff',
  status        text not null default 'invited',  -- invited|active|revoked
  created_at    timestamptz not null default now(),
  unique (supplier_id, invited_email)
);

create index if not exists supplier_members_user_idx on public.supplier_members (user_id);

alter table public.supplier_members enable row level security;

-- The owner (and admins) manage the team; members can see their own row.
drop policy if exists "members_select" on public.supplier_members;
create policy "members_select" on public.supplier_members
  for select to authenticated using (
    public.is_admin()
    or user_id = auth.uid()
    or exists (select 1 from public.suppliers s
               where s.id = supplier_id and s.owner_user_id = auth.uid())
  );

drop policy if exists "members_manage" on public.supplier_members;
create policy "members_manage" on public.supplier_members
  for all to authenticated
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

-- Active-member check used by the additive staff policies below.
create or replace function public.is_member(sup_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.supplier_members m
    where m.supplier_id = sup_id and m.user_id = auth.uid() and m.status = 'active'
  );
$$;
grant execute on function public.is_member(uuid) to anon, authenticated;

-- ---- Additive staff access on the operational tables -----------------------
-- suppliers: staff can read their supplier (owner keeps write).
drop policy if exists "suppliers_staff_select" on public.suppliers;
create policy "suppliers_staff_select" on public.suppliers
  for select to authenticated using (public.is_member(id));

-- products: staff read + write (write still requires the supplier be approved).
drop policy if exists "products_staff_read" on public.products;
create policy "products_staff_read" on public.products
  for select to authenticated using (public.is_member(supplier_id));

drop policy if exists "products_staff_write" on public.products;
create policy "products_staff_write" on public.products
  for all to authenticated
  using (
    public.is_member(supplier_id)
    and exists (select 1 from public.suppliers s where s.id = supplier_id and s.status = 'approved')
  )
  with check (
    public.is_member(supplier_id)
    and exists (select 1 from public.suppliers s where s.id = supplier_id and s.status = 'approved')
  );

-- inventory adjustments: staff read history + insert (approved supplier only).
drop policy if exists "adjustments_staff_read" on public.inventory_adjustments;
create policy "adjustments_staff_read" on public.inventory_adjustments
  for select to authenticated using (
    exists (select 1 from public.products p
            where p.id = product_id and public.is_member(p.supplier_id))
  );

drop policy if exists "adjustments_staff_insert" on public.inventory_adjustments;
create policy "adjustments_staff_insert" on public.inventory_adjustments
  for insert to authenticated with check (
    exists (
      select 1 from public.products p
      join public.suppliers s on s.id = p.supplier_id
      where p.id = product_id and public.is_member(p.supplier_id) and s.status = 'approved'
    )
  );

-- requests: staff read + update.
drop policy if exists "requests_staff_select" on public.product_requests;
create policy "requests_staff_select" on public.product_requests
  for select to authenticated using (public.is_member(supplier_id));

drop policy if exists "requests_staff_update" on public.product_requests;
create policy "requests_staff_update" on public.product_requests
  for update to authenticated
  using (public.is_member(supplier_id)) with check (public.is_member(supplier_id));

-- request items + messages: staff read (and reply).
drop policy if exists "request_items_staff_select" on public.request_items;
create policy "request_items_staff_select" on public.request_items
  for select to authenticated using (
    exists (select 1 from public.product_requests r
            where r.id = request_id and public.is_member(r.supplier_id))
  );

drop policy if exists "request_messages_staff_select" on public.request_messages;
create policy "request_messages_staff_select" on public.request_messages
  for select to authenticated using (
    exists (select 1 from public.product_requests r
            where r.id = request_id and public.is_member(r.supplier_id))
  );

drop policy if exists "request_messages_staff_insert" on public.request_messages;
create policy "request_messages_staff_insert" on public.request_messages
  for insert to authenticated with check (
    exists (select 1 from public.product_requests r
            where r.id = request_id and public.is_member(r.supplier_id))
  );
