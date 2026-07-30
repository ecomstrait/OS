-- ============================================================================
--  Only the supplier may decide a listing.
--
--  The merchant's existing "store_products_owner" policy is FOR ALL, which lets
--  them UPDATE their own rows — including flipping status to 'approved' and
--  skipping supplier review entirely. RLS can't restrict a single column, so
--  the status transition is guarded by a trigger instead.
--
--  Merchants keep full control over WHICH products they list (insert/delete);
--  they just can't decide the outcome.
-- ============================================================================

create or replace function public.enforce_listing_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_supplier boolean;
begin
  -- No JWT means a server-side caller (service_role, migrations, cron).
  if auth.uid() is null then
    return new;
  end if;

  is_supplier :=
    exists (
      select 1 from public.suppliers s
      where s.id = new.supplier_id and s.owner_user_id = auth.uid()
    )
    or exists (
      select 1 from public.supplier_members m
      where m.supplier_id = new.supplier_id
        and m.user_id = auth.uid() and m.status = 'active'
    );

  if tg_op = 'INSERT' then
    -- A merchant adding a listing always starts it pending, whatever they sent.
    if not is_supplier and not public.is_admin() then
      new.status := 'pending';
      new.decided_at := null;
      new.decline_reason := null;
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    if not is_supplier and not public.is_admin() then
      raise exception 'Only the supplier can approve or decline a listing request'
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists store_products_decision_guard on public.store_products;
create trigger store_products_decision_guard
  before insert or update on public.store_products
  for each row execute function public.enforce_listing_decision();
