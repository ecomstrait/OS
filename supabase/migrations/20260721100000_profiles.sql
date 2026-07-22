-- ============================================================================
--  Auth foundation for the Supplier Portal (and future apps).
--  One `profiles` row per auth user, carrying the platform role (RBAC). A row
--  is created automatically on signup by a trigger on auth.users.
-- ============================================================================

-- Platform roles (Doc 14). Suppliers by default; staff/admin assigned later.
do $$ begin
  create type public.user_role as enum ('supplier', 'supplier_staff', 'admin');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       public.user_role not null default 'supplier',
  full_name  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A user can read and update only their own profile. Role changes are NOT
-- allowed from the client (the update policy still lets `role` through at the
-- SQL level, but the app never exposes it; admin tooling uses the service role).
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-create a profile whenever a new auth user is inserted.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();
