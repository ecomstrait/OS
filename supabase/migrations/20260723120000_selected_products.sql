-- ============================================================================
--  Selected Inventory — the products a merchant has chosen to sell (the working
--  set the Store Builder imports). One row per (user, product). RLS: own only.
-- ============================================================================

create table if not exists public.selected_products (
  user_id    uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index if not exists selected_products_user_idx on public.selected_products (user_id);

alter table public.selected_products enable row level security;

drop policy if exists "selected_products_own" on public.selected_products;
create policy "selected_products_own" on public.selected_products
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
