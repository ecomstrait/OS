-- ============================================================================
--  "Return for edits" feedback — an admin sending a supplier application back
--  previously only flipped status to 'pending' with no record of why, so a
--  returned supplier saw the exact same "finish onboarding" banner as
--  someone who never started. Mirrors the existing decline_reason pattern
--  already used for listing declines (store_products.decline_reason,
--  20260730130000_store_product_listings.sql): a nullable free-text note,
--  plus a structured checklist since this ask is "select what's not good,"
--  not just free text.
-- ============================================================================

alter table public.suppliers
  add column if not exists return_reasons text[] not null default '{}',
  add column if not exists return_note text;
