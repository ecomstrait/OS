-- ============================================================================
--  Restore the standard Supabase role privileges on the public schema.
--  Supabase normally sets these up; a manual schema reset can drop them, which
--  causes "permission denied for table ..." for anon / authenticated /
--  service_role even though RLS would otherwise allow the query. RLS remains
--  the security boundary — these grants only let the roles *attempt* access.
-- ============================================================================

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables    in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;
