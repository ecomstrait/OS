-- ============================================================================
--  Idempotent wallet crediting.
--
--  Two independent things can now try to credit the same real-world Stripe
--  Checkout session: the `checkout.session.completed` webhook, and the
--  wallet page's on-load reconciliation fallback (added alongside this
--  migration, for when the webhook never fires or misfires). Stripe also
--  documents webhooks as "at least once" delivery — a redelivered event is
--  expected, not exceptional. Without a hard uniqueness guarantee at the DB
--  layer, any of these can race or duplicate and credit a wallet twice for
--  one payment. That's not acceptable for money-movement code.
--
--  `external_ref` gives each caller an idempotency key (Stripe's checkout
--  session id for a top-up) and a unique index enforces "applied at most
--  once" at the only layer that can actually guarantee it — a concurrent
--  duplicate call is rejected by the database itself, not by an app-level
--  check-then-act query, which cannot be made atomic from outside a single
--  statement/transaction.
-- ============================================================================

alter table public.wallet_transactions
  add column if not exists external_ref text;

create unique index if not exists wallet_transactions_external_ref_key
  on public.wallet_transactions (external_ref)
  where external_ref is not null;

-- Replace wallet_adjust with a 7-arg version (p_external_ref appended, so
-- existing positional callers aren't broken by argument reordering) and drop
-- the old 6-arg signature explicitly — `create or replace` does not replace
-- a function whose argument list changed shape; leaving the old one in place
-- would create an ambiguous overload for PostgREST's RPC name-based dispatch.
drop function if exists public.wallet_adjust(
  public.wallet_account_type, uuid, numeric, public.wallet_transaction_kind, uuid, text
);

create or replace function public.wallet_adjust(
  p_account_type public.wallet_account_type,
  p_account_id   uuid,
  p_amount       numeric(12, 2),
  p_kind         public.wallet_transaction_kind,
  p_order_id     uuid default null,
  p_note         text default null,
  p_external_ref text default null
) returns numeric(12, 2)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric(12, 2);
begin
  if p_account_type = 'merchant' then
    insert into public.merchant_wallets (user_id) values (p_account_id)
      on conflict (user_id) do nothing;

    update public.merchant_wallets
      set balance = balance + p_amount, updated_at = now()
      where user_id = p_account_id
        and (p_amount >= 0 or balance + p_amount >= 0)
      returning balance into v_balance;
  else
    insert into public.supplier_wallets (supplier_id) values (p_account_id)
      on conflict (supplier_id) do nothing;

    update public.supplier_wallets
      set balance = balance + p_amount, updated_at = now()
      where supplier_id = p_account_id
        and (p_amount >= 0 or balance + p_amount >= 0)
      returning balance into v_balance;
  end if;

  if v_balance is null then
    return null;  -- debit would go negative: caller's insufficient-balance path
  end if;

  insert into public.wallet_transactions
    (account_type, account_id, kind, amount, balance_after, order_id, note, external_ref)
  values
    (p_account_type, p_account_id, p_kind, p_amount, v_balance, p_order_id, p_note, p_external_ref);

  return v_balance;
exception when unique_violation then
  -- p_external_ref was already recorded by a call that committed first (a
  -- duplicate webhook delivery, or a race against the reconciliation
  -- fallback for the same Stripe session). Entering this exception block
  -- rolls back everything done since function entry, including the balance
  -- update above, so the real-world event still lands exactly once. Return
  -- the balance as it actually stands now, not what this discarded call
  -- would have made it.
  if p_external_ref is null then
    raise;  -- not an idempotency conflict (external_ref unset) — a genuine error
  end if;

  if p_account_type = 'merchant' then
    select balance into v_balance from public.merchant_wallets where user_id = p_account_id;
  else
    select balance into v_balance from public.supplier_wallets where supplier_id = p_account_id;
  end if;
  return v_balance;
end;
$$;

grant execute on function public.wallet_adjust(
  public.wallet_account_type, uuid, numeric, public.wallet_transaction_kind, uuid, text, text
) to service_role;
