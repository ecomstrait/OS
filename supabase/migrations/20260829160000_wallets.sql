-- ============================================================================
--  Merchant & supplier wallets + settlement (Docs/Credits-Settlement-Plan.md,
--  Phase 1: schema + ledger primitives).
--
--  Two money paths per order:
--   - prepaid (merchant already collected the sale): debit the merchant's
--     wallet for the supplier's cost + platform fee.
--   - COD (supplier collects cash at delivery): debit the supplier's wallet
--     for the merchant's margin + platform fee, up front.
--  `wallet_transactions` is the append-only ledger of record; the `balance`
--  column on the wallet tables is a cached running total kept in sync by
--  `public.wallet_adjust()` (same debit/credit function for both directions).
--  `payable_ledger` tracks what EcomStrait owes back out (supplier's cost on
--  a prepaid order, merchant's margin on a COD order) until the weekly
--  settlement batch pays it out — deliberately separate from wallet balances,
--  which are pre-funded money waiting to be spent, not money owed.
-- ============================================================================

do $$ begin
  create type public.wallet_account_type as enum ('merchant', 'supplier');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.wallet_transaction_kind as enum
    ('topup', 'order_deduction', 'order_credit', 'reversal', 'settlement_payout');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_payment_type as enum ('prepaid', 'cod');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_credit_status as enum
    ('deducted', 'awaiting_merchant_credits', 'awaiting_supplier_credits', 'reversed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payable_status as enum ('pending', 'settled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.settlement_batch_status as enum ('draft', 'paid');
exception when duplicate_object then null; end $$;

-- ---- merchant_wallets — one row per merchant, pooled across their stores --
create table if not exists public.merchant_wallets (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  balance    numeric(12, 2) not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.merchant_wallets enable row level security;

drop policy if exists "merchant_wallets_select_own" on public.merchant_wallets;
create policy "merchant_wallets_select_own" on public.merchant_wallets
  for select to authenticated using (public.is_admin() or auth.uid() = user_id);

drop policy if exists "merchant_wallets_admin_all" on public.merchant_wallets;
create policy "merchant_wallets_admin_all" on public.merchant_wallets
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop trigger if exists merchant_wallets_touch_updated_at on public.merchant_wallets;
create trigger merchant_wallets_touch_updated_at
  before update on public.merchant_wallets
  for each row execute function public.touch_updated_at();

-- ---- supplier_wallets — one row per supplier ------------------------------
create table if not exists public.supplier_wallets (
  supplier_id uuid primary key references public.suppliers (id) on delete cascade,
  balance     numeric(12, 2) not null default 0,
  updated_at  timestamptz not null default now()
);

alter table public.supplier_wallets enable row level security;

drop policy if exists "supplier_wallets_select_own" on public.supplier_wallets;
create policy "supplier_wallets_select_own" on public.supplier_wallets
  for select to authenticated using (
    public.is_admin()
    or exists (select 1 from public.suppliers s
               where s.id = supplier_id and s.owner_user_id = auth.uid())
  );

drop policy if exists "supplier_wallets_admin_all" on public.supplier_wallets;
create policy "supplier_wallets_admin_all" on public.supplier_wallets
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop trigger if exists supplier_wallets_touch_updated_at on public.supplier_wallets;
create trigger supplier_wallets_touch_updated_at
  before update on public.supplier_wallets
  for each row execute function public.touch_updated_at();

-- ---- wallet_transactions — append-only ledger, source of truth -----------
create table if not exists public.wallet_transactions (
  id            uuid primary key default gen_random_uuid(),
  account_type  public.wallet_account_type not null,
  account_id    uuid not null,  -- merchant_wallets.user_id or supplier_wallets.supplier_id
  kind          public.wallet_transaction_kind not null,
  amount        numeric(12, 2) not null,  -- signed: positive credits, negative debits
  balance_after numeric(12, 2) not null,
  order_id      uuid references public.orders (id) on delete set null,
  note          text,
  created_at    timestamptz not null default now()
);

create index if not exists wallet_transactions_account_idx
  on public.wallet_transactions (account_type, account_id, created_at desc);
create index if not exists wallet_transactions_order_idx
  on public.wallet_transactions (order_id);

alter table public.wallet_transactions enable row level security;

drop policy if exists "wallet_transactions_select_own" on public.wallet_transactions;
create policy "wallet_transactions_select_own" on public.wallet_transactions
  for select to authenticated using (
    public.is_admin()
    or (account_type = 'merchant' and account_id = auth.uid())
    or (account_type = 'supplier' and exists (
          select 1 from public.suppliers s
          where s.id = account_id and s.owner_user_id = auth.uid()))
  );

drop policy if exists "wallet_transactions_admin_all" on public.wallet_transactions;
create policy "wallet_transactions_admin_all" on public.wallet_transactions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---- wallet_adjust — the one place a balance ever changes -----------------
-- Atomically applies `p_amount` (signed) to the named wallet and writes the
-- matching ledger row in the same transaction, creating the wallet row on
-- first use. Returns the resulting balance, or null if a debit would have
-- taken the balance negative (caller treats null as "insufficient balance" —
-- this must fail closed, never silently let an order through un-debited).
-- security definer because the RLS policies above are read-only for
-- non-admins; every debit/credit goes through this function instead of a
-- direct table write.
create or replace function public.wallet_adjust(
  p_account_type public.wallet_account_type,
  p_account_id   uuid,
  p_amount       numeric(12, 2),
  p_kind         public.wallet_transaction_kind,
  p_order_id     uuid default null,
  p_note         text default null
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
    (account_type, account_id, kind, amount, balance_after, order_id, note)
  values
    (p_account_type, p_account_id, p_kind, p_amount, v_balance, p_order_id, p_note);

  return v_balance;
end;
$$;

grant execute on function public.wallet_adjust(
  public.wallet_account_type, uuid, numeric, public.wallet_transaction_kind, uuid, text
) to service_role;

-- ---- payable_ledger — what EcomStrait owes each party out of the wallets --
create table if not exists public.payable_ledger (
  id                  uuid primary key default gen_random_uuid(),
  account_type        public.wallet_account_type not null,
  account_id          uuid not null,  -- who this is owed TO
  order_id            uuid not null references public.orders (id) on delete cascade,
  amount              numeric(12, 2) not null,
  status              public.payable_status not null default 'pending',
  settlement_batch_id uuid,  -- fk added below, after settlement_batches exists
  created_at          timestamptz not null default now()
);

create index if not exists payable_ledger_account_idx
  on public.payable_ledger (account_type, account_id, status);
create index if not exists payable_ledger_order_idx on public.payable_ledger (order_id);

alter table public.payable_ledger enable row level security;

drop policy if exists "payable_ledger_select_own" on public.payable_ledger;
create policy "payable_ledger_select_own" on public.payable_ledger
  for select to authenticated using (
    public.is_admin()
    or (account_type = 'merchant' and account_id = auth.uid())
    or (account_type = 'supplier' and exists (
          select 1 from public.suppliers s
          where s.id = account_id and s.owner_user_id = auth.uid()))
  );

drop policy if exists "payable_ledger_admin_all" on public.payable_ledger;
create policy "payable_ledger_admin_all" on public.payable_ledger
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---- settlement_batches — one row per weekly settlement run ---------------
create table if not exists public.settlement_batches (
  id                  uuid primary key default gen_random_uuid(),
  period_start        timestamptz not null,
  period_end          timestamptz not null,
  run_at              timestamptz not null default now(),
  status              public.settlement_batch_status not null default 'draft',
  total_to_merchants  numeric(12, 2) not null default 0,
  total_to_suppliers  numeric(12, 2) not null default 0,
  paid_at             timestamptz,
  paid_by             uuid references auth.users (id) on delete set null
);

alter table public.settlement_batches enable row level security;

drop policy if exists "settlement_batches_admin_all" on public.settlement_batches;
create policy "settlement_batches_admin_all" on public.settlement_batches
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

do $$ begin
  alter table public.payable_ledger
    add constraint payable_ledger_settlement_batch_fkey
    foreign key (settlement_batch_id) references public.settlement_batches (id) on delete set null;
exception when duplicate_object then null; end $$;

-- ---- new columns on `orders` — see Docs/Credits-Settlement-Plan.md,
-- "Newly discovered gaps": `orders` had no link back to the merchant at all,
-- and no prepaid/COD signal. `store_id` is nullable because it backfills
-- nothing for orders that already exist; new orders must always set it.
alter table public.orders
  add column if not exists store_id uuid references public.stores (id) on delete set null,
  add column if not exists payment_type public.order_payment_type,
  add column if not exists cost_amount numeric(12, 2),
  add column if not exists margin_amount numeric(12, 2),
  add column if not exists platform_fee_amount numeric(12, 2),
  add column if not exists credit_status public.order_credit_status not null default 'deducted';

create index if not exists orders_store_idx on public.orders (store_id);
create index if not exists orders_credit_status_idx on public.orders (credit_status);
