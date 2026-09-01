-- ============================================================================
--  Link `public.orders` (the internal per-supplier order, holding
--  `credit_status`) back to `public.store_orders` (the customer-facing
--  checkout, one row per store purchase) — no relation between the two
--  existed before this. Needed so the merchant Orders page can show which of
--  a merchant's own orders are held on low credits, the same "unpaid / low
--  credits" state the Wallet page already surfaces, instead of that state
--  only ever being visible on /wallet.
-- ============================================================================

alter table public.orders
  add column if not exists store_order_id uuid references public.store_orders (id) on delete set null;

create index if not exists orders_store_order_idx on public.orders (store_order_id);
