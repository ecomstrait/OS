-- ============================================================================
--  Draft stores with a 3-day TTL.
--
--  A store row is now created when EcomAI first produces a plan, not when the
--  merchant presses Launch — the builder's content editor and media library
--  both need a real store id to attach to, so without this a merchant can't
--  upload a hero image until after their store is already live.
--
--  Expiry keys on `updated_at`, which `stores_touch_updated_at` (added in
--  20260723100000_merchant.sql) already maintains. A draft the merchant is
--  still editing therefore keeps resetting its own clock, and only genuinely
--  abandoned ones age out.
-- ============================================================================

-- When the merchant pressed Launch. NULL means "still in the builder".
--
-- Status can't answer that on its own: a launched Shopify store also sits at
-- 'draft' until it's been provisioned, because claiming a shop and pushing the
-- theme is real work that hasn't happened yet. Without this column the expiry
-- sweep would delete paid-for Shopify stores three days after launch, and the
-- plan's store limit would stop counting them at all.
alter table public.stores
  add column if not exists launched_at timestamptz;

-- Every row that exists today was created by Launch, so all of them are
-- launched. Only rows written after this migration can be builder drafts.
update public.stores
  set launched_at = created_at
  where launched_at is null;

-- The products chosen in the builder, held here until Launch.
--
-- They deliberately do NOT go into `store_products`: that table's rows are
-- supplier listings, and one inserted at 'pending' lands in a supplier's
-- approval queue. A store nobody has launched yet must not put work in front
-- of a supplier, so the selection waits here as plain JSON — [{id, price}] —
-- and `createStore` writes the real listings in one go.
alter table public.stores
  add column if not exists draft_products jsonb not null default '[]';

-- Supports the expiry sweep: unlaunched drafts ordered by last activity.
create index if not exists stores_draft_expiry_idx
  on public.stores (updated_at)
  where status = 'draft' and launched_at is null;

-- Supports "reuse this merchant's newest draft" on builder re-entry, which is
-- what stops an indecisive merchant accumulating a row per attempt.
create index if not exists stores_user_draft_idx
  on public.stores (user_id, updated_at desc)
  where status = 'draft' and launched_at is null;
