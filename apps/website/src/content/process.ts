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
      "Verified suppliers list their catalog once. EcomAI enriches every product with descriptions, attributes, and imagery — ready to sell.",
  },
  {
    icon: "MessageSquare",
    title: "Ask EcomAI to build your business",
    description:
      "Tell your co-founder what you want to sell. EcomAI matches your niche to suppliers, products, and a store concept in seconds.",
  },
  {
    icon: "Wand2",
    title: "EcomAI builds your store",
    description:
      "Branding, homepage, collections, product copy, and SEO — generated end to end in minutes, fully responsive and ready to convert.",
  },
  {
    icon: "Eye",
    title: "Preview & refine together",
    description:
      "See your store live on desktop, tablet, and mobile. Ask EcomAI to change the concept, colors, or copy until it feels exactly right.",
  },
  {
    icon: "Rocket",
    title: "Launch & grow on autopilot",
    description:
      "Go live on your own domain with payments and shipping wired up. EcomAI keeps optimizing SEO, marketing, and conversion as you sell.",
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
