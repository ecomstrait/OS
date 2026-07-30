-- ============================================================================
--  Listing approvals: a merchant listing a supplier's product on a store now
--  needs that supplier's approval before it goes live.
--
--  `store_products` gains the state rather than a parallel requests table, so
--  "what is listed on this store" has exactly one source of truth. The supplier
--  queue reads pending rows; the storefront reads approved ones.
-- ============================================================================

-- Adding with default 'approved' backfills every existing row as live (they
-- already are), then the default flips so NEW listings start pending.
alter table public.store_products
  add column if not exists status text not null default 'approved';
alter table public.store_products
  alter column status set default 'pending';

alter table public.store_products
  add column if not exists supplier_id uuid references public.suppliers (id) on delete cascade,
  add column if not exists decided_at timestamptz,
  add column if not exists decline_reason text,
  add column if not exists created_at timestamptz not null default now();

do $$ begin
  alter table public.store_products
    add constraint store_products_status_check
    check (status in ('pending', 'approved', 'declined'));
exception when duplicate_object then null; end $$;

-- Denormalised so the supplier queue is a single-table scan rather than a join
-- through products on every poll.
update public.store_products sp
   set supplier_id = p.supplier_id
  from public.products p
 where p.id = sp.product_id
   and sp.supplier_id is null;

create index if not exists store_products_supplier_status_idx
  on public.store_products (supplier_id, status, created_at desc);

create index if not exists store_products_store_status_idx
  on public.store_products (store_id, status);

-- ---- RLS --------------------------------------------------------------------
-- The merchant policy already exists ("store_products_owner", full access to
-- rows on their own stores). Suppliers additionally need to see and decide the
-- rows that reference their products — but must not be able to add or remove
-- listings, which stays the merchant's call.

drop policy if exists "store_products_supplier_select" on public.store_products;
create policy "store_products_supplier_select" on public.store_products
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.suppliers s
      where s.id = store_products.supplier_id and s.owner_user_id = auth.uid()
    )
    or exists (
      select 1 from public.supplier_members m
      where m.supplier_id = store_products.supplier_id
        and m.user_id = auth.uid() and m.status = 'active'
    )
  );

drop policy if exists "store_products_supplier_decide" on public.store_products;
create policy "store_products_supplier_decide" on public.store_products
  for update to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.suppliers s
      where s.id = store_products.supplier_id and s.owner_user_id = auth.uid()
    )
    or exists (
      select 1 from public.supplier_members m
      where m.supplier_id = store_products.supplier_id
        and m.user_id = auth.uid() and m.status = 'active'
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.suppliers s
      where s.id = store_products.supplier_id and s.owner_user_id = auth.uid()
    )
    or exists (
      select 1 from public.supplier_members m
      where m.supplier_id = store_products.supplier_id
        and m.user_id = auth.uid() and m.status = 'active'
    )
  );

grant all on public.store_products to anon, authenticated, service_role;
