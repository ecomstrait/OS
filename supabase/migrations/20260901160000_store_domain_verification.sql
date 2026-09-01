-- Custom-domain routing needs two things the original `domain` column never
-- had: a persisted signal that DNS was actually proven to point at us before
-- we ever route live traffic to a domain, and a guarantee two stores can't
-- both claim the same one (the column had no uniqueness at all).

alter table public.stores
  add column if not exists domain_verified_at timestamptz;

-- Case-insensitive ("YourBrand.com" and "yourbrand.com" are the same host)
-- and partial (only when set), so any number of stores can still have
-- domain = null.
create unique index if not exists stores_domain_unique_idx
  on public.stores (lower(domain))
  where domain is not null;
