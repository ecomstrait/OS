/**
 * Founders Waitlist drip — the "30 Days to Your First Business" nurture.
 *
 * Honesty rule (see Docs/AI-Implementation-Plan.md): this is a *preview* of what
 * building with EcomAI looks like, framed as education + anticipation. It never
 * claims the reader has made sales or launched anything. All figures are labeled
 * example ranges. Sent on real, staggered dates via Resend `scheduledAt`.
 *
 * Typed data (Sanity-ready) so copy can move to a CMS without touching code.
 */

export type WaitlistEmail = {
  /** Ordinal in the sequence. */
  step: number;
  /** Days after signup to send. 0 = immediate welcome. */
  delayDays: number;
  subject: string;
  /** Hidden inbox preview text. */
  preheader: string;
  heading: string;
  /** Body paragraphs (rendered as <p>). */
  body: string[];
  /** Optional bullet list rendered under the body. */
  bullets?: string[];
  cta: { label: string; href: string };
};

const SITE = "https://ecomstrait.com";

export const waitlistDrip: WaitlistEmail[] = [
  {
    step: 0,
    delayDays: 0,
    subject: "You're on the Founders Waitlist 🚀",
    preheader: "Here's what happens next — and what your first 30 days will look like.",
    heading: "Welcome to EcomStrait, founder.",
    body: [
      "You just reserved your spot on the Founders Waitlist for EcomAI — the world's first AI ecommerce co-founder.",
      "Over the next few weeks we'll show you exactly how EcomAI turns a single idea into a launched, on-brand online store: suppliers, products, SEO, and marketing included. Think of it as a preview of your first 30 days as a founder.",
      "No jargon, no fluff — just what your future business could look like with an AI co-founder that never sleeps.",
    ],
    bullets: [
      "Day 3 — how EcomAI builds a store from one sentence",
      "Day 7 — finding verified suppliers & winning products",
      "Day 15 — marketing that runs itself",
      "Day 30 — your first 30 days, mapped end to end",
    ],
    cta: { label: "Watch AI build a business", href: `${SITE}/#builder` },
  },
  {
    step: 1,
    delayDays: 3,
    subject: "From one sentence to a live store",
    preheader: "\"I want to sell perfumes.\" → a finished storefront in under a minute.",
    heading: "This is how EcomAI builds.",
    body: [
      "Most people think launching a store means weeks of design, developers, and a stack of tools. With EcomAI it starts with a sentence.",
      "You describe what you want to sell. EcomAI understands the niche, finds suppliers, imports products, generates your brand and homepage, writes your SEO, and hands you a live, mobile-ready storefront — all in one flow you can watch happen.",
      "It's a simulated preview today, rolling out in beta to founders like you first.",
    ],
    bullets: [
      "Understand the idea → find suppliers → import products",
      "Brand & logo → homepage → SEO → mobile version",
      "Payments & shipping configured → optimized for conversion",
    ],
    cta: { label: "Try the AI store builder", href: `${SITE}/#builder` },
  },
  {
    step: 2,
    delayDays: 7,
    subject: "Where profitable products actually come from",
    preheader: "Verified suppliers and example margins in the 40–55% range.",
    heading: "Suppliers & products, sorted.",
    body: [
      "The hardest part of ecommerce isn't the website — it's finding trustworthy suppliers and products people actually want. That's where an AI co-founder earns its keep.",
      "Tell EcomAI a niche and it surfaces verified suppliers, recommends products with healthy example margins, and imports them ready to sell. You approve; EcomAI does the legwork.",
      "Example figures below are illustrative ranges from our niche knowledge base — not a guarantee, but a realistic starting picture.",
    ],
    bullets: [
      "Verified suppliers matched to your niche",
      "Example margins in the ~40–55% range, depending on category",
      "Products imported with descriptions and pricing ready",
    ],
    cta: { label: "Explore niches with EcomAI", href: `${SITE}/#simulator` },
  },
  {
    step: 3,
    delayDays: 15,
    subject: "Marketing that runs while you sleep",
    preheader: "SEO, campaigns, and conversion tuning — handled by your co-founder.",
    heading: "Growth, on autopilot.",
    body: [
      "A store nobody sees can't sell. EcomAI doesn't stop at launch — it acts as your marketing and SEO consultant too.",
      "It writes your SEO, drafts campaign ideas, spots conversion leaks (weak images, slow checkout, missing upsells), and suggests fixes with example uplift ranges so you always know the next best move.",
      "You stay in control. EcomAI just makes sure you're never staring at a blank dashboard wondering what to do next.",
    ],
    bullets: [
      "Automated SEO and product copy",
      "Conversion suggestions with labeled example ranges",
      "Bundles, upsells, and subscription ideas on tap",
    ],
    cta: { label: "Ask EcomAI a growth question", href: `${SITE}/faq` },
  },
  {
    step: 4,
    delayDays: 30,
    subject: "Your first 30 days as a founder",
    preheader: "The full picture — and early access when the beta opens.",
    heading: "30 days, start to finish.",
    body: [
      "Here's the arc you've been previewing: an idea on day one, a live store minutes later, suppliers and products in the first week, and a marketing engine humming by the end of the month. That's the future EcomAI is built to hand you.",
      "We're opening the beta to Founders Waitlist members first. As one of them, you'll get early access, founder pricing, and a direct line to the team as we roll it out.",
      "When you're ready, tell EcomAI what business you want to build. Your co-founder is waiting.",
    ],
    cta: { label: "Build your business", href: `${SITE}/#builder` },
  },
];
