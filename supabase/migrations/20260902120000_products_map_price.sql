-- ============================================================================
--  MAP (minimum advertised price), set by the supplier alongside the
--  existing wholesale/retail (MSRP) pair. Enforced at the DB layer, not just
--  app code — the same reasoning as enforce_listing_decision
--  (20260730140000_listing_decision_guard.sql): RLS's "FOR ALL" grant on
--  store_products can't be scoped to a single column, so a merchant's own
--  session-scoped client could otherwise write any price. Unlike that
--  trigger, this one has no service-role/admin bypass — MAP is a pricing
--  floor that should hold even for a system cascade (cascadeSupplierPrice,
--  product-propagation.ts), not a "who's allowed to decide" question.
-- ============================================================================

alter table public.products
  add column if not exists map_price numeric(12, 2);

create or replace function public.enforce_map_price()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_map numeric(12, 2);
begin
  if new.price is null then
    return new;
  end if;

  select map_price into v_map from public.products where id = new.product_id;

  if v_map is not null and new.price < v_map then
    raise exception 'Price is below the minimum advertised price set by the supplier'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists store_products_map_price_guard on public.store_products;
create trigger store_products_map_price_guard
  before insert or update on public.store_products
  for each row execute function public.enforce_map_price();
