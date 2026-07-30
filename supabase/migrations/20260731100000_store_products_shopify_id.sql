-- ============================================================================
--  Record the Shopify product a listing became.
--
--  Sync previously deduped by matching the variant SKU (which holds our product
--  id). That breaks the moment a merchant edits a SKU in Shopify admin — the
--  product stops matching and the next sync creates a duplicate. Storing the
--  Shopify product id makes the link explicit and survives SKU edits.
-- ============================================================================

alter table public.store_products
  add column if not exists shopify_product_id text,
  add column if not exists shopify_synced_at timestamptz;

-- Sync reads "which of this store's listings are already in Shopify".
create index if not exists store_products_shopify_id_idx
  on public.store_products (store_id)
  where shopify_product_id is not null;
