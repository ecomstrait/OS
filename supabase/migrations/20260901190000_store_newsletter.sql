-- Caches the Resend Audience id created for a store's newsletter signups —
-- lazily created on first subscriber (see newsletter.ts), one audience per
-- store so a merchant's list stays their own rather than mixed into a
-- platform-wide list they can't send to.

alter table public.stores
  add column if not exists newsletter_audience_id text;
