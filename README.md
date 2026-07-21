# EcomStrait — The AI Ecommerce Co-Founder

Marketing & product site for **EcomStrait**, positioned around **EcomAI** —
"the world's first AI ecommerce co-founder." The site doesn't just describe the
platform; it lets a visitor *watch their future business get built*: describe an
idea, and EcomAI finds suppliers, imports products, generates a branded store,
writes SEO, and hands back a live preview — as a labeled, simulated preview.

## Stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript**
- **Tailwind CSS v4** (CSS-first design tokens in `src/app/globals.css`)
- **Framer Motion** (interactive AI moments, scroll reveals) · reduced-motion safe
- **Recharts** (AI Business Simulator estimates)
- **Lucide** icons (+ inline brand SVGs for socials)
- **Supabase** (lead / newsletter / waitlist / analytics storage)
- **Resend** (team notifications + Founders Waitlist drip)
- **Groq (Llama)** — the EcomAI engine, behind a preset fallback

## Getting started

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # production build (typechecks + prerenders all routes)
pnpm start      # serve production build
pnpm lint
```

Copy `.env.example` → `.env.local` and fill in keys. Everything degrades
gracefully: with no keys the AI demos run on the deterministic **preset engine**
and forms no-op safely.

## The EcomAI engine

`src/lib/ecomai.ts` exposes one facade, `generateBusinessPlan(input)`, with two
implementations behind it:

- **Preset engine** — deterministic, grounded in the niche knowledge base
  (`src/content/niches.ts`). Always on, instant.
- **Groq engine** — Groq-hosted Llama (JSON mode). Falls back to the preset on
  any error / timeout / missing key.

Output is a structured, **labeled** `BusinessPlan` (a simulated preview — example
ranges, never presented as live data). The API route (`/api/ecomai`) adds an
in-memory cache. Model is swappable via `GROQ_MODEL`.

## Flagship AI moments

- **Hero + AI Builder** (`components/home/ai-builder.tsx`) — idea → conversation →
  `00:00 → 00:50` build timeline → live store preview → **Founders Waitlist**.
- **AI Business Simulator** (`components/home/ai-simulator.tsx`) — persona picker
  → conversational qualify → estimated revenue/profit/margin (ROI merged in).
- **Ask EcomAI** (`/faq`, `components/ecomai/ask-ecomai.tsx`) — live chat instead
  of a static FAQ.

## Founders Waitlist + drip

`WaitlistForm` → `/api/waitlist` → `lib/waitlist.ts`:

1. persists to Supabase `waitlist_subscribers` (idempotent),
2. for a new subscriber, sends the Day-0 welcome and **schedules the "30 Days to
   Your First Business" drip** (`content/waitlist-emails.ts`) via Resend
   `scheduledAt`,
3. notifies the team.

## Analytics

Vendor-free funnel tracking: `track()` (`src/lib/analytics.ts`) →  `/api/track`
→ Supabase `analytics_events`, mirrored to gtag/dataLayer if present. Events:
`idea_submitted`, `build_clicked`, `waitlist_joined`. Swap the sink without
touching call sites.

## Structure

```
src/
  app/                 # routes + API routes (ecomai, ask, lead, newsletter, waitlist, track)
  components/
    layout/            # announcement bar, navbar, footer
    home/              # homepage sections (hero, ai-builder, ai-simulator, …)
    ecomai/            # EcomAI kit (avatar, ask-ecomai)
    pages/             # per-page sections (why, services, suppliers, store-owners)
    shared/            # cross-page pieces (page-header, cta-banner, forms, waitlist-form)
    store/             # generated storefront demo
    ui/                # primitives (button, badge, section, reveal, accordion, icon)
  content/             # typed, Sanity-ready content (niches, faqs, services, waitlist-emails, …)
  lib/                 # ecomai engine, waitlist, analytics, notify, supabase, site config
supabase/migrations/   # leads/newsletter + waitlist/analytics schema
```

## Database

Run the SQL migrations in `supabase/migrations/` against your Supabase project
(or `supabase db push`). Tables are **write-only** from the browser (RLS allows
anonymous INSERT only); read submissions from the dashboard or with the service
role.

See `Docs/` for full product specs and `Docs/AI-Implementation-Plan.md` for the
"AI Co-Founder" build plan.
