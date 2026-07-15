import type { IconName } from "@/components/ui/icon";

export type AiFeature = {
  icon: IconName;
  title: string;
  description: string;
  status?: "live" | "soon";
};

export const aiFeatures: AiFeature[] = [
  { icon: "Wand2", title: "AI Website Builder", description: "Generate a complete storefront from a prompt — branding, pages, and content.", status: "live" },
  { icon: "Bot", title: "Business Consultant", description: "Ask anything about pricing, products, and strategy. Get answers grounded in your data.", status: "live" },
  { icon: "PenTool", title: "AI Product Writer", description: "SEO-ready titles, descriptions, and attributes for your entire catalog.", status: "live" },
  { icon: "Search", title: "SEO Assistant", description: "Automated metadata, keywords, and structured data to help you rank.", status: "live" },
  { icon: "MessageSquare", title: "Marketing Assistant", description: "Draft campaigns, emails, and ad copy tuned to your brand voice.", status: "live" },
  { icon: "LineChart", title: "Analytics Intelligence", description: "Conversational analytics — ask questions, get charts and insights back.", status: "live" },
  { icon: "TrendingUp", title: "Sales Forecasting", description: "Predict demand and revenue to plan inventory and cash flow.", status: "soon" },
  { icon: "Package", title: "Inventory Intelligence", description: "Smart restock and pricing recommendations based on live demand.", status: "soon" },
  { icon: "Brain", title: "Multi-Agent Automation", description: "Coordinated AI agents that run workflows across your business.", status: "soon" },
];

export const aiPromptExamples = [
  "Build me a modern cosmetics store with a clean, minimal look.",
  "Write SEO descriptions for my 40 new sports products.",
  "What price should I set for a 60% margin at $18 wholesale?",
  "Draft a launch email campaign for my furniture collection.",
  "Forecast next month's revenue based on my current trend.",
];
