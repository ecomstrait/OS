-- ============================================================================
--  "Make it yours" — hand a dev store over to the merchant's own Shopify account.
--
--  The merchant signs up for Shopify through our referral link, tells us the
--  email on that account, and an admin performs the transfer in Shopify. The
--  `waiting_for_transfer` / `transferred` statuses already existed on
--  shopify_stores; these columns record who it's going to and when it was asked
--  for, so the admin queue has something to act on.
-- ============================================================================

alter table public.shopify_stores
  add column if not exists transfer_email text,
  add column if not exists transfer_requested_at timestamptz;

-- The admin queue reads "who's waiting", oldest request first.
create index if not exists shopify_stores_transfer_idx
  on public.shopify_stores (status, transfer_requested_at)
  where transfer_requested_at is not null;

-- The existing "shopify_stores_owner_select" policy lets an assigned merchant
-- read their row but not write it, so requesting a transfer goes through the
-- service role in the app layer rather than a new merchant-write policy —
-- merchants must not be able to set their own status to 'transferred'.
