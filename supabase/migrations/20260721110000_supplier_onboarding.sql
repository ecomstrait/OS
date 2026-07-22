-- ============================================================================
--  Supplier onboarding (Doc 09): the business/tenant row, verification levels,
--  and uploaded documents. One supplier per auth user for now (staff later).
--  RLS scopes every row to its owner via suppliers.owner_user_id = auth.uid().
-- ============================================================================

-- ---- suppliers (the tenant + all onboarding fields) ------------------------
create table if not exists public.suppliers (
  id                     uuid primary key default gen_random_uuid(),
  owner_user_id          uuid not null unique references auth.users (id) on delete cascade,

  -- Step 1 · Business information
  business_name          text,
  business_type          text,
  contact_person         text,
  phone                  text,
  country                text,
  city                   text,
  website                text,

  -- Step 2 · Business details
  years_in_business      text,
  product_categories     text[] not null default '{}',
  number_of_products     text,
  manufacturing_type     text,      -- 'manufacturer' | 'reseller' | 'both'
  description            text,

  -- Step 4 · Product information
  estimated_inventory_size text,
  average_lead_time      text,
  shipping_regions       text[] not null default '{}',
  min_order_quantity     text,

  -- Step 5 · Account setup
  marketing_opt_in       boolean not null default false,
  terms_accepted_at      timestamptz,

  -- Lifecycle
  status                 text not null default 'pending',  -- pending|in_review|approved|rejected
  onboarding_step        smallint not null default 1,
  quality_score          int,

  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists suppliers_status_idx on public.suppliers (status);

alter table public.suppliers enable row level security;

drop policy if exists "suppliers_select_own" on public.suppliers;
create policy "suppliers_select_own" on public.suppliers
  for select to authenticated using (auth.uid() = owner_user_id);

drop policy if exists "suppliers_insert_own" on public.suppliers;
create policy "suppliers_insert_own" on public.suppliers
  for insert to authenticated with check (auth.uid() = owner_user_id);

drop policy if exists "suppliers_update_own" on public.suppliers;
create policy "suppliers_update_own" on public.suppliers
  for update to authenticated
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

drop trigger if exists suppliers_touch_updated_at on public.suppliers;
create trigger suppliers_touch_updated_at
  before update on public.suppliers
  for each row execute function public.touch_updated_at();

-- ---- supplier_verification (the 5 levels, Doc 09) --------------------------
create table if not exists public.supplier_verification (
  supplier_id           uuid primary key references public.suppliers (id) on delete cascade,
  email_verified_at     timestamptz,
  phone_verified_at     timestamptz,
  documents_verified_at timestamptz,
  manual_reviewed_at    timestamptz,
  badge_granted_at      timestamptz,
  updated_at            timestamptz not null default now()
);

alter table public.supplier_verification enable row level security;

drop policy if exists "verification_select_own" on public.supplier_verification;
create policy "verification_select_own" on public.supplier_verification
  for select to authenticated using (
    exists (select 1 from public.suppliers s
            where s.id = supplier_id and s.owner_user_id = auth.uid())
  );

drop policy if exists "verification_write_own" on public.supplier_verification;
create policy "verification_write_own" on public.supplier_verification
  for all to authenticated
  using (
    exists (select 1 from public.suppliers s
            where s.id = supplier_id and s.owner_user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.suppliers s
            where s.id = supplier_id and s.owner_user_id = auth.uid())
  );

-- ---- supplier_documents ----------------------------------------------------
create table if not exists public.supplier_documents (
  id           uuid primary key default gen_random_uuid(),
  supplier_id  uuid not null references public.suppliers (id) on delete cascade,
  type         text not null,   -- business_registration|tax_registration|national_id|company_logo|address_proof
  storage_path text not null,
  status       text not null default 'uploaded',  -- uploaded|verified|rejected
  created_at   timestamptz not null default now()
);

create index if not exists supplier_documents_supplier_idx on public.supplier_documents (supplier_id);

alter table public.supplier_documents enable row level security;

drop policy if exists "documents_write_own" on public.supplier_documents;
create policy "documents_write_own" on public.supplier_documents
  for all to authenticated
  using (
    exists (select 1 from public.suppliers s
            where s.id = supplier_id and s.owner_user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.suppliers s
            where s.id = supplier_id and s.owner_user_id = auth.uid())
  );

-- ---- private storage bucket for documents ----------------------------------
insert into storage.buckets (id, name, public)
values ('supplier-documents', 'supplier-documents', false)
on conflict (id) do nothing;

-- Each user reads/writes only under a top folder named by their auth uid,
-- e.g. "<uid>/national_id-169...pdf". Version-independent (path-based).
drop policy if exists "supplier_docs_rw_own" on storage.objects;
create policy "supplier_docs_rw_own" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'supplier-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'supplier-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
