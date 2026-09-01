-- ============================================================================
--  COD cancellation reversal (Docs/Credits-Settlement-Plan.md, §1 open
--  decision #2, confirmed 2026-09-01: reverse the supplier's upfront
--  margin+fee deduction when a COD order is cancelled before delivery).
--
--  A dedicated, narrowly-scoped function rather than opening up
--  `wallet_adjust` to `authenticated`: the caller here is the supplier's own
--  session-scoped client (apps/supplier's `setOrderStatus`, not a
--  service-role admin client), so the authorization check has to live in the
--  database, not trust the caller.
-- ============================================================================

create or replace function public.reverse_cod_deduction(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_new_balance numeric(12, 2);
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    return false;
  end if;

  -- No-op (not an error) for anything not eligible, so a caller retrying an
  -- already-reversed or non-COD order doesn't get a scary failure — this is
  -- meant to be called unconditionally from setOrderStatus on any
  -- cancellation, not just ones known in advance to be COD.
  if v_order.payment_type <> 'cod'
     or v_order.credit_status <> 'deducted'
     or v_order.status <> 'cancelled' then
    return false;
  end if;

  if not (
    public.is_admin()
    or exists (select 1 from public.suppliers s
               where s.id = v_order.supplier_id and s.owner_user_id = auth.uid())
  ) then
    raise exception 'Not authorized to reverse this order.';
  end if;

  v_new_balance := public.wallet_adjust(
    'supplier', v_order.supplier_id,
    coalesce(v_order.margin_amount, 0) + coalesce(v_order.platform_fee_amount, 0),
    'reversal', p_order_id, 'COD order cancelled before delivery'
  );

  -- The merchant's payable for this order almost always hasn't been settled
  -- yet (settlement is weekly) — void it so they aren't paid out for a sale
  -- that never happened. If it's already been settled by the time of
  -- cancellation, this intentionally does nothing further: reconciling an
  -- already-paid-out settlement batch is a known gap, out of scope here (see
  -- Docs/Credits-Settlement-Plan.md).
  delete from public.payable_ledger
   where order_id = p_order_id and account_type = 'merchant' and status = 'pending';

  update public.orders set credit_status = 'reversed' where id = p_order_id;

  return v_new_balance is not null;
end;
$$;

grant execute on function public.reverse_cod_deduction(uuid) to authenticated;
