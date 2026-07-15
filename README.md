# EcomStrait — Marketing & Showcase Website

The AI-powered Commerce Operating System. This repo is **Phase 1**: the public
marketing / showcase website. Later phases (supplier, merchant & admin portals,
and the EcomAI services) will be added as separate apps.

## Stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript**
- **Tailwind CSS v4** (CSS-first design tokens in `src/app/globals.css`)
- **Framer Motion** (scroll reveals, micro-interactions)
- **Recharts** (ROI calculator / charts)
- **Lucide** icons (+ inline brand SVGs for socials)
- Fonts: Plus Jakarta Sans (display), Inter (body), JetBrains Mono (code)

## Getting started

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # production build
pnpm start      # serve production build
pnpm lint
```

## Structure

```
src/
  app/                 # routes (one folder per page) + sitemap/robots/icon
  components/
    layout/            # announcement bar, navbar, footer
    home/              # homepage sections (hero, ecom-ai, roi-calculator, …)
    shared/            # cross-page pieces (page-header, cta-banner, forms, gallery)
    ui/                # primitives (button, badge, section, reveal, accordion, icon)
  content/             # hardcoded, typed content — Sanity-ready (stats, faqs, services, …)
  lib/                 # site config (nav/footer/meta) + utils
```

## Design system

Brand tokens live in `src/app/globals.css` under `@theme`:

- `ink-*` — Deep Navy scale (primary)
- `brand-*` — Emerald (growth / commerce)
- `ai-*` — Electric Blue (EcomAI / intelligence)

Custom utilities: `container-px`, `text-gradient`, `glass`, `bg-grid`,
`bg-grid-dark`, plus `animate-aurora` / `animate-marquee` / `animate-float`.

## Content

All copy is hardcoded in `src/content/*` and `src/lib/site.ts`, typed and shaped
so it can be swapped to **Sanity CMS** later without touching components. Forms
(`src/components/shared/lead-form.tsx`, `newsletter-form.tsx`) validate client-side
and simulate submit — wire them to an API route / CRM in a later phase.

## Roadmap (from `Docs/`)

1. **Website (this repo)** ✅ marketing site, gallery, lead capture
2. Supplier / Merchant / Admin portals
3. EcomAI services (website builder, product writer, analytics, forecasting)
4. Enterprise + Commerce OS modules

See `Docs/` for full product specifications.
