-- ============================================================================
--  Store assets — a logo URL on the store, and a public bucket for logos the
--  merchant imports. Path-based write RLS (each user under their own uid folder).
-- ============================================================================

alter table public.stores add column if not exists logo_url text;

insert into storage.buckets (id, name, public)
values ('store-logos', 'store-logos', true)
on conflict (id) do nothing;

drop policy if exists "store_logos_read" on storage.objects;
create policy "store_logos_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'store-logos');

drop policy if exists "store_logos_write_own" on storage.objects;
create policy "store_logos_write_own" on storage.objects
  for all to authenticated
  using (bucket_id = 'store-logos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'store-logos' and (storage.foldername(name))[1] = auth.uid()::text);
