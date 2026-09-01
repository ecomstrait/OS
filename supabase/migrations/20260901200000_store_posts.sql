-- Blog/content pages — the evergreen-SEO-content half of "AI writes the SEO
-- content" that category descriptions don't cover. A post can be AI-drafted
-- or written from scratch by the merchant; either way it's just a row here
-- until it's published.

create table if not exists public.store_posts (
  id             uuid primary key default gen_random_uuid(),
  store_id       uuid not null references public.stores (id) on delete cascade,
  title          text not null,
  -- URL segment under /store/<id>/blog/<slug> — unique per store, not globally.
  slug           text not null,
  excerpt        text,
  -- Plain text, paragraphs separated by a blank line — same minimal-markup
  -- convention as everywhere else content lives in this app (StorePlan's
  -- `about`/section `body` fields), not a rich-text/HTML editor.
  body           text not null default '',
  cover_image    text,
  status         text not null default 'draft' check (status in ('draft', 'published')),
  -- Who wrote the current draft — doesn't change what a merchant can do
  -- with it (edit/publish either way), just labels it in the authoring UI.
  source         text not null default 'merchant' check (source in ('ai', 'merchant')),
  seo_title      text,
  seo_description text,
  -- NULL until the first publish; a later unpublish/republish cycle keeps
  -- the original value so "posted on" doesn't drift on every edit.
  published_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create unique index if not exists store_posts_store_slug_idx on public.store_posts (store_id, slug);
create index if not exists store_posts_store_published_idx
  on public.store_posts (store_id, status, published_at desc);

drop trigger if exists store_posts_touch_updated_at on public.store_posts;
create trigger store_posts_touch_updated_at
  before update on public.store_posts
  for each row execute function public.touch_updated_at();

alter table public.store_posts enable row level security;

drop policy if exists "store_posts_owner_all" on public.store_posts;
create policy "store_posts_owner_all" on public.store_posts
  for all to authenticated
  using (
    exists (
      select 1 from public.stores s
      where s.id = store_posts.store_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.stores s
      where s.id = store_posts.store_id and s.user_id = auth.uid()
    )
  );

drop policy if exists "store_posts_admin_all" on public.store_posts;
create policy "store_posts_admin_all" on public.store_posts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
