-- ============================================================================
--  Fix `orders`' customer fields — found while auditing order data for
--  correctness. `store_owner_name`/`store_owner_email` on `orders` have
--  never actually held the store owner's (merchant's) info: `order-sink.ts`
--  populates them from the END CUSTOMER's name/email. The name collided with
--  `product_requests`, which has its own, correctly-named
--  store_owner_name/email columns for a genuinely different purpose (a
--  merchant's request to a supplier) — that table is untouched here.
--
--  The mislabeling was actively misleading in the supplier's order detail
--  page (labeled "Store owner" with a mail icon, showing the customer's
--  email) and, combined with the shipping address never being rendered at
--  all there, meant a supplier had no reliable way to see who they're
--  actually shipping to. `customer_phone` is new — no phone was captured
--  anywhere before this, despite being essential for delivery/COD.
-- ============================================================================

alter table public.orders rename column store_owner_name to customer_name;
alter table public.orders rename column store_owner_email to customer_email;
alter table public.orders add column if not exists customer_phone text;
