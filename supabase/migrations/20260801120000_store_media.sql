-- ============================================================================
--  Store media library.
--
--  Content stays in `stores.content` (versioned, RLS'd, and what EcomAI edits).
--  Only the binaries move out: Supabase storage is fine for logos but poor for
--  hero images and video, so uploads go to Cloudflare R2 when it's configured
--  and this table is the index either way.
--
--  `provider` records where the bytes actually live, because deleting an asset
--  has to reach the right place — and a store built before R2 was configured
--  still has Supabase-hosted media that must keep working.
-- ============================================================================

create table if not exists public.store_assets (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null default 'image' check (kind in ('image', 'video')),
  provider text not null default 'supabase' check (provider in ('supabase', 'r2')),
  url text not null,
  -- Provider handle for deletion: the R2 object key, or the storage path.
  external_id text,
  file_name text,
  mime_type text,
  bytes bigint,
  width int,
  height int,
  -- Set when the merchant assigns it to a slot (hero, about, banner…), so the
  -- library can show what's in use and the editor can look one up by role.
  role text,
  alt text,
  created_at timestamptz not null default now()
);

create index if not exists store_assets_store_idx
  on public.store_assets (store_id, created_at desc);
create index if not exists store_assets_role_idx
  on public.store_assets (store_id, role);

alter table public.store_assets enable row level security;

-- The merchant who owns the store owns its media.
drop policy if exists "store_assets_owner" on public.store_assets;
create policy "store_assets_owner" on public.store_assets
  for all to authenticated
  using (
    exists (
      select 1 from public.stores s
      where s.id = store_assets.store_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.stores s
      where s.id = store_assets.store_id and s.user_id = auth.uid()
    )
  );

-- Storefronts are public and read media through the service role, so no anon
-- policy is needed here.

-- Fallback bucket, used when R2 isn't configured. Public-read like
-- store-logos, with the same uid-folder write scoping.
insert into storage.buckets (id, name, public)
values ('store-assets', 'store-assets', true)
on conflict (id) do nothing;

drop policy if exists "store_assets_read" on storage.objects;
create policy "store_assets_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'store-assets');

drop policy if exists "store_assets_write_own" on storage.objects;
create policy "store_assets_write_own" on storage.objects
  for all to authenticated
  using (bucket_id = 'store-assets' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'store-assets' and (storage.foldername(name))[1] = auth.uid()::text);
