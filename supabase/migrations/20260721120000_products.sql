-- ============================================================================
--  Product catalog (Doc 09). Products belong to a supplier; RLS scopes them to
--  the owner. Basic `stock` lives here; richer inventory (reserved, history,
--  alerts) arrives in a later phase.
-- ============================================================================

create table if not exists public.products (
  id                  uuid primary key default gen_random_uuid(),
  supplier_id         uuid not null references public.suppliers (id) on delete cascade,
  title               text not null,
  description         text,
  category            text,
  images              text[] not null default '{}',
  sku                 text,
  wholesale_price     numeric(12, 2),
  retail_price        numeric(12, 2),
  stock               int not null default 0,
  low_stock_threshold int not null default 5,
  status              text not null default 'draft',  -- draft | published
  seo_title           text,
  seo_description     text,
  variants            jsonb not null default '[]',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists products_supplier_idx on public.products (supplier_id);
create index if not exists products_status_idx on public.products (status);

alter table public.products enable row level security;

-- Owner (via suppliers) can do everything with their own products.
drop policy if exists "products_write_own" on public.products;
create policy "products_write_own" on public.products
  for all to authenticated
  using (
    exists (select 1 from public.suppliers s
            where s.id = supplier_id and s.owner_user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.suppliers s
            where s.id = supplier_id and s.owner_user_id = auth.uid())
  );

-- Published products are world-readable (for future storefronts / merchant app).
drop policy if exists "products_read_published" on public.products;
create policy "products_read_published" on public.products
  for select to anon, authenticated
  using (status = 'published');

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

-- ---- public bucket for product images --------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Anyone can read; each user writes only under their own "<uid>/…" folder.
drop policy if exists "product_images_read" on storage.objects;
create policy "product_images_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists "product_images_write_own" on storage.objects;
create policy "product_images_write_own" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
