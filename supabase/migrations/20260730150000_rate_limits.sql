-- ============================================================================
--  Rate limiting for the public storefront API.
--
--  The cart and checkout endpoints are unauthenticated, so they need a limiter
--  that holds across serverless instances — an in-process counter would reset
--  on every cold start and be trivially sidestepped. A fixed window in Postgres
--  costs one round trip and is shared by every instance.
-- ============================================================================

create table if not exists public.rate_limits (
  bucket       text not null,
  window_start timestamptz not null,
  hits         integer not null default 0,
  primary key (bucket, window_start)
);

-- Supports the periodic sweep of expired windows.
create index if not exists rate_limits_window_idx on public.rate_limits (window_start);

-- No policies: RLS on with none defined denies anon/authenticated outright,
-- while service_role (the only caller) bypasses RLS.
alter table public.rate_limits enable row level security;

/**
 * Count one hit against `p_bucket` and report whether it's still under the cap.
 *
 * The insert-on-conflict-increment is a single atomic statement, so concurrent
 * requests can't both read a stale count and slip through.
 */
create or replace function public.bump_rate_limit(
  p_bucket text,
  p_window_seconds integer,
  p_limit integer
)
returns table (hits integer, allowed boolean, reset_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  w timestamptz;
  h integer;
begin
  -- Snap to a fixed window so every instance agrees on the boundary.
  w := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into public.rate_limits as rl (bucket, window_start, hits)
  values (p_bucket, w, 1)
  on conflict (bucket, window_start) do update set hits = rl.hits + 1
  returning rl.hits into h;

  -- Occasional sweep instead of a cron job; expired windows are dead weight.
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 hour';
  end if;

  return query select h, h <= p_limit, w + make_interval(secs => p_window_seconds);
end;
$$;

revoke all on function public.bump_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.bump_rate_limit(text, integer, integer) to service_role;
grant all on public.rate_limits to service_role;
