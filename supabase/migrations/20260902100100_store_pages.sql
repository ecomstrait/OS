-- Custom pages (Contact Us, FAQ, Shipping, ...) — created, edited, or removed
-- straight from the EcomAI chat (see applyMerchantRequest's "page" intent in
-- ecomai.ts), not just the fixed set of StorePlan fields the chat could
-- touch before. Deliberately no draft/publish state like store_posts: a page
-- a merchant asks for in chat is meant to exist the moment they ask.

create table if not exists public.store_pages (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references public.stores (id) on delete cascade,
  title      text not null,
  -- URL segment under /store/<id>/<slug> — unique per store, not globally.
  -- Never one of the storefront's own reserved segments (products, blog,
  -- success) — enforced in code (RESERVED_SLUGS in builder-actions.ts), not
  -- here, since Postgres can't easily express "not in this literal set" as
  -- cleanly as a one-line JS check the AI's chosen slug already passes through.
  slug       text not null,
  body       text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists store_pages_store_slug_idx on public.store_pages (store_id, slug);

drop trigger if exists store_pages_touch_updated_at on public.store_pages;
create trigger store_pages_touch_updated_at
  before update on public.store_pages
  for each row execute function public.touch_updated_at();

alter table public.store_pages enable row level security;

drop policy if exists "store_pages_owner_all" on public.store_pages;
create policy "store_pages_owner_all" on public.store_pages
  for all to authenticated
  using (
    exists (
      select 1 from public.stores s
      where s.id = store_pages.store_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.stores s
      where s.id = store_pages.store_id and s.user_id = auth.uid()
    )
  );

drop policy if exists "store_pages_admin_all" on public.store_pages;
create policy "store_pages_admin_all" on public.store_pages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
