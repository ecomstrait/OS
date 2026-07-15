import type { IconName } from "@/components/ui/icon";

export type Step = {
  icon: IconName;
  title: string;
  description: string;
};

/** The core Supply → Request → Build → Launch journey. */
export const howItWorks: Step[] = [
  {
    icon: "Boxes",
    title: "Suppliers publish products",
    description:
      "Verified suppliers upload their catalog once. AI enriches every product with descriptions, attributes, and imagery.",
  },
  {
    icon: "MessageSquare",
    title: "You request a store",
    description:
      "Tell us what you want to sell. Pick a niche and products from the marketplace, or describe your dream store to EcomAI.",
  },
  {
    icon: "Wand2",
    title: "AI builds your website",
    description:
      "EcomAI generates branding, pages, product content, and SEO in minutes — fully responsive and ready to convert.",
  },
  {
    icon: "Eye",
    title: "Preview & refine",
    description:
      "See your store live on desktop, tablet, and mobile. Tweak anything with a prompt until it feels exactly right.",
  },
  {
    icon: "Rocket",
    title: "Deploy & start selling",
    description:
      "Launch to your own domain with payments, shipping, and inventory sync configured. Orders route to suppliers automatically.",
  },
];

export const supplierBenefits = [
  { icon: "Globe" as IconName, title: "Reach more retailers", description: "Get discovered by thousands of store owners actively building catalogs." },
  { icon: "Workflow" as IconName, title: "Automated order flow", description: "Orders arrive ready to fulfil — no manual processing or spreadsheets." },
  { icon: "Package" as IconName, title: "Central inventory", description: "Manage stock once; it stays in sync across every store selling your products." },
  { icon: "BarChart3" as IconName, title: "Supplier analytics", description: "See demand, top products, and revenue trends in a real-time dashboard." },
  { icon: "Shield" as IconName, title: "Verification & trust", description: "A verified badge builds buyer confidence and increases conversion." },
  { icon: "Sparkles" as IconName, title: "AI product enrichment", description: "AI writes descriptions, tags, and SEO for your entire catalog automatically." },
];

export const storeOwnerBenefits = [
  { icon: "Rocket" as IconName, title: "Launch in hours", description: "Go from idea to a live, professional storefront in a single sitting." },
  { icon: "Package" as IconName, title: "No inventory risk", description: "Sell products you don't hold. Suppliers stock and ship for you." },
  { icon: "Wand2" as IconName, title: "AI-built website", description: "A complete, on-brand store generated for you — no code, no designers." },
  { icon: "Eye" as IconName, title: "Live preview", description: "Watch your store come together in real time and refine with prompts." },
  { icon: "Bot" as IconName, title: "AI business advisor", description: "Get pricing, product, and marketing guidance whenever you need it." },
  { icon: "TrendingUp" as IconName, title: "Built to grow", description: "Analytics, automation, and SEO baked in to scale from day one." },
];
