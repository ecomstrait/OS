-- AI-written, cached category descriptions — real SEO copy per category
-- listing page instead of a bare product grid. Generated lazily (see
-- storefront-category-content.ts) and cached forever per (store, category)
-- rather than regenerated on every pageview.

create table if not exists public.store_category_content (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores (id) on delete cascade,
  -- The same string `products.category`/`listStoreCategories` use — including
  -- the `__uncategorized__` sentinel, so this table never needs its own
  -- notion of "which categories exist."
  category     text not null,
  description  text not null,
  created_at   timestamptz not null default now()
);

create unique index if not exists store_category_content_unique_idx
  on public.store_category_content (store_id, category);

alter table public.store_category_content enable row level security;

-- Reachable only through a store the caller owns — same pattern as
-- store_theme_versions. The storefront itself reads this exclusively via
-- the admin client (public catalog reads never go through RLS here), so
-- this only matters if a merchant-facing UI reads it directly later.
drop policy if exists "store_category_content_owner_all" on public.store_category_content;
create policy "store_category_content_owner_all" on public.store_category_content
  for all to authenticated
  using (
    exists (
      select 1 from public.stores s
      where s.id = store_category_content.store_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.stores s
      where s.id = store_category_content.store_id and s.user_id = auth.uid()
    )
  );

drop policy if exists "store_category_content_admin_all" on public.store_category_content;
create policy "store_category_content_admin_all" on public.store_category_content
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
