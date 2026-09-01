import type { IconName } from "@/components/ui/icon";

export type Service = {
  icon: IconName;
  title: string;
  description: string;
  features: string[];
};

export const services: Service[] = [
  // AI Website Builder — hidden from the site for now, not removed.
  // {
  //   icon: "Wand2",
  //   title: "AI Website Builder",
  //   description:
  //     "Generate a complete, on-brand ecommerce website from a single prompt — homepage, collections, product pages, and copy.",
  //   features: ["Brand generation", "Responsive by default", "Live preview", "One-click deploy"],
  // },
  {
    icon: "Boxes",
    title: "Supplier Consultant",
    description:
      "Onboard, verify, and manage suppliers with centralized catalogs and automated product publishing.",
    features: ["Verification workflow", "Central catalog", "Bulk publishing", "Supplier analytics"],
  },
  {
    icon: "Store",
    title: "Launch Specialist",
    description:
      "Our team configures payments, shipping, taxes, and domains so your store is ready to sell on day one.",
    features: ["Payment gateways", "Shipping rules", "Tax config", "Custom domain"],
  },
  {
    icon: "ShoppingBag",
    title: "Shopify Development",
    description:
      "Custom Shopify themes and apps built to convert, fully integrated with the EcomStrait supplier network.",
    features: ["Custom themes", "App integrations", "Migrations", "Speed tuning"],
  },
  {
    icon: "Code2",
    title: "Custom Ecommerce",
    description:
      "Bespoke, high-performance storefronts for brands that need full control over experience and scale.",
    features: ["Headless builds", "Custom checkout", "API integrations", "Enterprise scale"],
  },
  {
    icon: "Package",
    title: "Inventory Manager",
    description:
      "Real-time inventory synchronization across suppliers and storefronts — no more overselling.",
    features: ["Live sync", "Low-stock alerts", "Multi-supplier", "Automated updates"],
  },
  {
    icon: "FileText",
    title: "AI Product Writer",
    description:
      "AI-generated descriptions, attributes, and media organization for catalogs of any size.",
    features: ["AI descriptions", "Bulk editing", "Rich media", "Attribute mapping"],
  },
  {
    icon: "Search",
    title: "SEO Consultant",
    description:
      "Automated metadata, structured data, and content that helps your store rank from launch.",
    features: ["Auto metadata", "Structured data", "Sitemaps", "Content generation"],
  },
  {
    icon: "Server",
    title: "Hosting & Maintenance",
    description:
      "Fast, secure, globally distributed hosting with monitoring, backups, and updates handled for you.",
    features: ["Global CDN", "Daily backups", "99.9% uptime", "Security patches"],
  },
  {
    icon: "Workflow",
    title: "Automation Expert",
    description:
      "Automate orders, notifications, and repetitive workflows so your team focuses on growth.",
    features: ["Order routing", "Smart notifications", "Workflow builder", "Integrations"],
  },
  {
    icon: "BarChart3",
    title: "Sales Analyst",
    description:
      "Unified dashboards for revenue, orders, customers, and AI-surfaced insights in real time.",
    features: ["Revenue tracking", "Cohort analysis", "Executive reports", "Live metrics"],
  },
  {
    icon: "Bot",
    title: "AI Business Advisor",
    description:
      "Ask EcomAI anything — pricing, product ideas, marketing, forecasts — and act on the answer.",
    features: ["Business Q&A", "Pricing advice", "Forecasting", "Marketing plans"],
  },
];
