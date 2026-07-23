-- Storefront password for a Shopify dev store (dev stores are password-locked).
-- Admin stores it in the pool; the assigned merchant can read it (owner RLS).
alter table public.shopify_stores add column if not exists storefront_password text;
