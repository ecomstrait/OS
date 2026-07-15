export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  company: string;
  initials: string;
  metric?: string;
};

export const testimonials: Testimonial[] = [
  {
    quote:
      "I went from an idea to a live cosmetics store in a single weekend. The AI wrote every product description and the SEO — things that would've taken me weeks.",
    name: "Ayesha Khan",
    role: "Founder",
    company: "Lumière Beauty",
    initials: "AK",
    metric: "0 → $14k/mo in 90 days",
  },
  {
    quote:
      "As a supplier, our wholesale reach tripled. Store owners find us, orders come in automatically, and inventory stays in sync without a spreadsheet in sight.",
    name: "Daniel Osei",
    role: "Operations Lead",
    company: "NorthField Textiles",
    initials: "DO",
    metric: "3× wholesale orders",
  },
  {
    quote:
      "We run stores for clients as an agency. EcomStrait replaced four tools and cut our build time by 80%. The live preview closes deals on the spot.",
    name: "Priya Nair",
    role: "Managing Director",
    company: "Craft & Co. Agency",
    initials: "PN",
    metric: "80% faster launches",
  },
  {
    quote:
      "The ROI calculator and AI business advisor helped me price correctly from day one. It genuinely feels like having a co-founder who never sleeps.",
    name: "Marcus Lee",
    role: "Owner",
    company: "Peak Sports Gear",
    initials: "ML",
    metric: "4.9★ customer rating",
  },
];

export const trustedLogos = [
  "Shopify",
  "Stripe",
  "PayPal",
  "OpenAI",
  "Google",
  "Microsoft",
  "Cloudflare",
  "Vercel",
];
