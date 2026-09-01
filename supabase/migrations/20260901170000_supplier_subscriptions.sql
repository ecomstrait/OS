-- ============================================================================
--  Supplier subscriptions/plans + daily AI-token usage — the supplier-side
--  counterpart to the merchant app's `subscriptions`/`usage_daily`
--  (supabase/migrations/20260723100000_merchant.sql), reusing the same
--  `plan_tier`/`subscription_status` enums (already generic, not
--  merchant-specific).
--
--  Keyed by `supplier_id` (the business), not `user_id`: a supplier's wallet
--  balance is already pooled per business (`supplier_wallets.supplier_id`,
--  20260829160000_wallets.sql), and a supplier can have staff
--  (`supplier_members`) in addition to its owner — a subscription is a
--  business-level thing, not a per-staff-account one, same reasoning.
-- ============================================================================

create table if not exists public.supplier_subscriptions (
  supplier_id             uuid primary key references public.suppliers (id) on delete cascade,
  plan                    public.plan_tier not null default 'free',
  status                  public.subscription_status not null default 'active',
  stripe_customer_id      text,
  stripe_subscription_id  text,
  current_period_end      timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.supplier_subscriptions enable row level security;

-- Owner OR active staff can see the business's plan (unlike
-- `supplier_wallets_select_own`, which only checks ownership — deliberately
-- not copied here, since `getSupplierContext()` already treats active staff
-- as full members of the business for every other purpose).
drop policy if exists "supplier_subscriptions_select_own" on public.supplier_subscriptions;
create policy "supplier_subscriptions_select_own" on public.supplier_subscriptions
  for select to authenticated using (
    public.is_admin()
    or exists (select 1 from public.suppliers s
               where s.id = supplier_id and s.owner_user_id = auth.uid())
    or exists (select 1 from public.supplier_members m
               where m.supplier_id = supplier_id and m.user_id = auth.uid() and m.status = 'active')
  );

-- No authenticated write policy: writes go only through the service-role
-- admin client (billing actions + Stripe webhook), same as the merchant
-- app's `subscriptions` table.
drop policy if exists "supplier_subscriptions_admin_all" on public.supplier_subscriptions;
create policy "supplier_subscriptions_admin_all" on public.supplier_subscriptions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop trigger if exists supplier_subscriptions_touch_updated_at on public.supplier_subscriptions;
create trigger supplier_subscriptions_touch_updated_at
  before update on public.supplier_subscriptions
  for each row execute function public.touch_updated_at();

-- ---- supplier_usage_daily (AI-token quota, one row per supplier per day) ---
create table if not exists public.supplier_usage_daily (
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  day         date not null default current_date,
  tokens_used bigint not null default 0,
  primary key (supplier_id, day)
);

alter table public.supplier_usage_daily enable row level security;

drop policy if exists "supplier_usage_select_own" on public.supplier_usage_daily;
create policy "supplier_usage_select_own" on public.supplier_usage_daily
  for select to authenticated using (
    public.is_admin()
    or exists (select 1 from public.suppliers s
               where s.id = supplier_id and s.owner_user_id = auth.uid())
    or exists (select 1 from public.supplier_members m
               where m.supplier_id = supplier_id and m.user_id = auth.uid() and m.status = 'active')
  );

drop policy if exists "supplier_usage_write_own" on public.supplier_usage_daily;
create policy "supplier_usage_write_own" on public.supplier_usage_daily
  for all to authenticated
  using (
    exists (select 1 from public.suppliers s
            where s.id = supplier_id and s.owner_user_id = auth.uid())
    or exists (select 1 from public.supplier_members m
               where m.supplier_id = supplier_id and m.user_id = auth.uid() and m.status = 'active')
  )
  with check (
    exists (select 1 from public.suppliers s
            where s.id = supplier_id and s.owner_user_id = auth.uid())
    or exists (select 1 from public.supplier_members m
               where m.supplier_id = supplier_id and m.user_id = auth.uid() and m.status = 'active')
  );
