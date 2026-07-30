-- ============================================================================
--  Store theme version history.
--  EcomAI edits overwrite `stores.content` in place, so a merchant had no way
--  back from a change they didn't like. Every mutation now snapshots the
--  PREVIOUS look here first, making "undo my last change" a single restore.
--
--  A snapshot captures the whole visual state — the plan JSON plus the theme id
--  and logo — so restoring returns the store to exactly how it looked.
-- ============================================================================

create table if not exists public.store_theme_versions (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references public.stores (id) on delete cascade,
  content    jsonb not null default '{}'::jsonb,
  theme      text,
  logo_url   text,
  -- What produced this state, e.g. the AI instruction that replaced it.
  label      text,
  created_at timestamptz not null default now()
);

-- The only read pattern: newest-first for one store.
create index if not exists store_theme_versions_store_created_idx
  on public.store_theme_versions (store_id, created_at desc);

alter table public.store_theme_versions enable row level security;

-- History is reachable only through a store the caller owns. `exists` against
-- stores keeps the ownership rule in one place rather than duplicating user_id.
drop policy if exists "store_versions_owner_all" on public.store_theme_versions;
create policy "store_versions_owner_all" on public.store_theme_versions
  for all to authenticated
  using (
    exists (
      select 1 from public.stores s
      where s.id = store_theme_versions.store_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.stores s
      where s.id = store_theme_versions.store_id and s.user_id = auth.uid()
    )
  );

drop policy if exists "store_versions_admin_all" on public.store_theme_versions;
create policy "store_versions_admin_all" on public.store_theme_versions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant all on public.store_theme_versions to anon, authenticated, service_role;
