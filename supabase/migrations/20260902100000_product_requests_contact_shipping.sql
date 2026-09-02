-- ============================================================================
--  Add contact phone + shipping address to `product_requests`.
--
--  Neither existed before: a request only ever carried store_owner_name/email
--  and free-text note/timeline, with no structured way to capture a phone
--  number or where the goods would ship to. Needed for the admin's sample-
--  request form (apps/supplier/src/lib/admin-actions.ts) to actually collect
--  contact + shipping details as asked, and it's a real gap for genuine
--  merchant-generated requests too, not just the sample-data tool — same
--  reasoning `orders.customer_phone` was added for (see
--  supabase/migrations/20260901130000_orders_customer_fields.sql: "no phone
--  was captured anywhere before this, despite being essential for delivery").
-- ============================================================================

alter table public.product_requests
  add column if not exists store_owner_phone text,
  add column if not exists shipping text;
