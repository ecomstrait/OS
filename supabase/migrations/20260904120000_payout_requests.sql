-- Wallet withdrawals + a per-payable admin hold (Docs/Credits-Settlement-Plan.md
-- follow-up).
--
-- Two distinct things, kept separate on purpose:
--  - `payable_ledger` / settlement (settlement.ts) is purely internal
--    bookkeeping — what EcomStrait's ledger says it owes an account. It
--    never moves real money and a merchant/supplier never sees "settlement"
--    as a concept.
--  - `payout_requests` below is the actual cash-out mechanism: a merchant or
--    supplier picks an amount and gives their bank account, EcomStrait
--    processes it manually (bank transfer, outside this app) and uploads a
--    receipt as proof once done. This is what a merchant/supplier
--    experiences as "withdrawing."
--
-- Neither table moves money by itself — same manual-MVP posture as the rest
-- of the wallet system.

-- ---- payable_ledger: a per-row admin hold, excluded from settlement runs --
alter table public.payable_ledger add column if not exists held boolean not null default false;

create index if not exists payable_ledger_pending_unheld_idx
  on public.payable_ledger (account_type, account_id)
  where status = 'pending' and not held;

-- ---- payout_requests -------------------------------------------------------
do $$ begin
  create type public.payout_request_status as enum ('pending', 'paid', 'declined');
exception when duplicate_object then null; end $$;

create table if not exists public.payout_requests (
  id                   uuid primary key default gen_random_uuid(),
  account_type         public.wallet_account_type not null,
  account_id           uuid not null,
  -- The amount the requester chose to withdraw, not necessarily their whole
  -- pending balance — validated against it at request time, not re-checked
  -- later (the balance can keep moving).
  amount               numeric(12, 2) not null check (amount > 0),
  bank_account_name    text not null,
  bank_name            text not null,
  bank_account_number  text not null,
  -- Routing / IFSC / SWIFT — label and format vary by country, so this is
  -- one free-text field rather than several country-specific ones.
  bank_routing_code    text,
  note                 text,
  status               public.payout_request_status not null default 'pending',
  -- Path within the `payout-receipts` bucket (not a full URL — that bucket
  -- is private; every read goes through a signed URL generated on demand).
  -- Set once an admin marks this paid.
  receipt_path         text,
  -- Admin's own note — a reason on decline, or e.g. "wired Sep 10" on paid.
  admin_note           text,
  requested_at         timestamptz not null default now(),
  reviewed_at          timestamptz,
  reviewed_by          uuid references auth.users (id) on delete set null
);

create index if not exists payout_requests_account_idx
  on public.payout_requests (account_type, account_id, status);

-- ---- link a withdrawal request to the specific ledger rows it cashes out --
-- Without this, "Pending payout" on the wallet page never moves when a
-- withdrawal is marked paid (the underlying payable_ledger rows are still
-- 'pending'), and those same rows could also get swept into a separate
-- weekly settlement batch — the same money processed twice. This is set the
-- moment a request is submitted (earmarking specific rows, oldest first, up
-- to the requested amount — see requestPayout in each app's
-- wallet-actions.ts), which also implicitly holds them (`held = true`) so a
-- settlement run in between can't touch them either. On approval
-- (markPayoutRequestPaid) those exact rows flip to `status = 'paid_out'`;
-- on decline (declinePayoutRequest) the link and hold are both cleared,
-- returning them to the normal pending pool.
alter table public.payable_ledger add column if not exists payout_request_id uuid
  references public.payout_requests (id) on delete set null;

create index if not exists payable_ledger_payout_request_idx
  on public.payable_ledger (payout_request_id)
  where payout_request_id is not null;

-- A payable_ledger row settled via a direct withdrawal, as opposed to the
-- weekly batch ('settled'). Both are terminal / excluded from
-- runWeeklySettlement — kept distinct only so the two payout mechanisms
-- stay individually auditable in the ledger.
--
-- `ADD VALUE IF NOT EXISTS` must run as its own top-level statement — unlike
-- every other enum/table above, it cannot be wrapped in a `do $$ ... $$`
-- block (Postgres rejects ALTER TYPE ... ADD VALUE from inside a function
-- body), and IF NOT EXISTS already makes it safe to re-run on its own.
alter type public.payable_status add value if not exists 'paid_out';

alter table public.payout_requests enable row level security;

drop policy if exists "payout_requests_select_own" on public.payout_requests;
create policy "payout_requests_select_own" on public.payout_requests
  for select to authenticated using (
    public.is_admin()
    or (account_type = 'merchant' and account_id = auth.uid())
    or (account_type = 'supplier' and exists (
          select 1 from public.suppliers s
          where s.id = account_id and s.owner_user_id = auth.uid()))
  );

drop policy if exists "payout_requests_insert_own" on public.payout_requests;
create policy "payout_requests_insert_own" on public.payout_requests
  for insert to authenticated with check (
    (account_type = 'merchant' and account_id = auth.uid())
    or (account_type = 'supplier' and exists (
          select 1 from public.suppliers s
          where s.id = account_id and s.owner_user_id = auth.uid()))
  );

-- Update (marking paid/declined, attaching a receipt) is admin-only — a
-- requester can create and read their own request but never edit it.
drop policy if exists "payout_requests_admin_update" on public.payout_requests;
create policy "payout_requests_admin_update" on public.payout_requests
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---- payout-receipts — private bucket for admin-uploaded proof of payment -
-- Private (unlike the public `avatars` bucket): a payment receipt is
-- sensitive, so every read is a short-lived signed URL, generated on demand
-- for the request's own owner or an admin — never a public/guessable URL.
-- Object path convention: `${payoutRequestId}/receipt.<ext>`.
insert into storage.buckets (id, name, public)
values ('payout-receipts', 'payout-receipts', false)
on conflict (id) do nothing;

drop policy if exists "payout_receipts_read" on storage.objects;
create policy "payout_receipts_read" on storage.objects
  for select to authenticated using (
    bucket_id = 'payout-receipts' and (
      public.is_admin()
      or exists (
        select 1 from public.payout_requests pr
        where pr.id::text = (storage.foldername(name))[1]
          and (
            (pr.account_type = 'merchant' and pr.account_id = auth.uid())
            or (pr.account_type = 'supplier' and exists (
                  select 1 from public.suppliers s
                  where s.id = pr.account_id and s.owner_user_id = auth.uid()))
          )
      )
    )
  );

drop policy if exists "payout_receipts_write_admin" on storage.objects;
create policy "payout_receipts_write_admin" on storage.objects
  for all to authenticated
  using (bucket_id = 'payout-receipts' and public.is_admin())
  with check (bucket_id = 'payout-receipts' and public.is_admin());
