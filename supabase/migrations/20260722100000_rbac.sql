-- ============================================================================
--  Roles & RBAC hardening (Doc 14).
--   - Expand the platform role set.
--   - Central role helpers (is_admin / current_user_role) for RLS.
--   - Secure signup: metadata can only self-assign non-privileged roles.
--   - Admin-visibility RLS policies across every app table + document storage.
--  `public.profiles` remains the single source of truth for a user's role.
-- ============================================================================

-- ---- 1. Expand the role enum ----------------------------------------------
alter type public.user_role add value if not exists 'business_owner';
alter type public.user_role add value if not exists 'customer';

-- ---- 2. Role helpers (security definer to avoid RLS recursion) -------------
create or replace function public.current_user_role()
returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where user_id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where user_id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.current_user_role() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ---- 3. Secure signup role assignment -------------------------------------
--  Users may self-assign only non-privileged roles via signup metadata.
--  admin / supplier_staff are NEVER self-assignable (granted by an admin).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public as $$
declare
  requested text := nullif(new.raw_user_meta_data ->> 'role', '');
  assigned  public.user_role := 'supplier';
begin
  if requested in ('supplier', 'business_owner', 'customer') then
    assigned := requested::public.user_role;
  end if;
  insert into public.profiles (user_id, full_name, role)
  values (new.id, nullif(new.raw_user_meta_data ->> 'full_name', ''), assigned)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- ---- 4. Admin-visibility RLS policies -------------------------------------
--  Owner-scoped policies from earlier migrations stay; these ADD admin access
--  so RBAC is enforced in the database (not just via the service role).

-- profiles: admins can read & manage every profile (e.g. change roles).
drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- suppliers + related
drop policy if exists "suppliers_admin_all" on public.suppliers;
create policy "suppliers_admin_all" on public.suppliers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "verification_admin_all" on public.supplier_verification;
create policy "verification_admin_all" on public.supplier_verification
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "documents_admin_all" on public.supplier_documents;
create policy "documents_admin_all" on public.supplier_documents
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "products_admin_all" on public.products;
create policy "products_admin_all" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "adjustments_admin_read" on public.inventory_adjustments;
create policy "adjustments_admin_read" on public.inventory_adjustments
  for select to authenticated using (public.is_admin());

-- Admins can read private supplier documents in storage (for review).
drop policy if exists "supplier_docs_admin_read" on storage.objects;
create policy "supplier_docs_admin_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'supplier-documents' and public.is_admin());
