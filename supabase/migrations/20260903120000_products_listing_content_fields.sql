-- ============================================================================
--  Listing-trust content: buyers need to see sizing/material/fit before they
--  risk a purchase from a new store, and each store needs its own shipping/
--  returns line since that policy isn't the supplier's to set.
--
--  `sizes` / `material` / `fit_note` are physical facts about the product —
--  true everywhere it's sold — so they live on `products`, next to
--  description/category, edited by the supplier.
--
--  `shipping_note` varies store to store, so it lives on `store_products`,
--  edited by the merchant (that table's RLS is already `for all` to the
--  owning merchant — see `store_products_owner` — so no policy change here).
--
--  `shopify_handle` rides along on `store_products` too: it's what lets a
--  generated Shopify theme link a rendered "Best sellers" card back to the
--  product's live page, alongside the `shopify_product_id` already captured
--  at sync time.
-- ============================================================================

alter table public.products
  add column if not exists sizes    text,
  add column if not exists material text,
  add column if not exists fit_note text;

alter table public.store_products
  add column if not exists shipping_note  text,
  add column if not exists shopify_handle text;
