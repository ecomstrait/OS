-- ============================================================================
--  Inventory (Doc 09): reserved stock + an adjustment audit log. Available
--  stock = stock - reserved. Low-stock/out-of-stock are derived from
--  products.low_stock_threshold. (Warehouses / barcodes are future work.)
-- ============================================================================

alter table public.products
  add column if not exists reserved int not null default 0;

-- Every stock change is logged with a delta, reason, and resulting level.
create table if not exists public.inventory_adjustments (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references public.products (id) on delete cascade,
  delta           int not null,
  reason          text,
  resulting_stock int not null,
  created_at      timestamptz not null default now()
);

create index if not exists inventory_adjustments_product_idx
  on public.inventory_adjustments (product_id, created_at desc);

alter table public.inventory_adjustments enable row level security;

-- Read/write only for adjustments whose product belongs to the caller.
drop policy if exists "adjustments_read_own" on public.inventory_adjustments;
create policy "adjustments_read_own" on public.inventory_adjustments
  for select to authenticated using (
    exists (
      select 1 from public.products p
      join public.suppliers s on s.id = p.supplier_id
      where p.id = product_id and s.owner_user_id = auth.uid()
    )
  );

drop policy if exists "adjustments_insert_own" on public.inventory_adjustments;
create policy "adjustments_insert_own" on public.inventory_adjustments
  for insert to authenticated with check (
    exists (
      select 1 from public.products p
      join public.suppliers s on s.id = p.supplier_id
      where p.id = product_id and s.owner_user_id = auth.uid()
    )
  );
