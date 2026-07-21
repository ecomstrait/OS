import type { IconName } from "@/components/ui/icon";

/**
 * Founder Stories — narrative, ILLUSTRATIVE journeys showing the "idea → built →
 * launched → early result" arc with EcomAI as the co-founder. Every figure is a
 * labeled example (a simulated preview), never presented as a real customer stat.
 */

export type StoryBeat = { icon: IconName; when: string; label: string };

export type FounderStory = {
  name: string;
  initials: string;
  niche: string;
  emoji: string;
  summary: string;
  beats: StoryBeat[];
  result: string; // labeled example outcome
};

export const founderStories: FounderStory[] = [
  {
    name: "Sarah",
    initials: "S",
    niche: "Clean skincare",
    emoji: "🧴",
    summary: "Wanted to start a clean beauty brand — no code, no inventory.",
    beats: [
      { icon: "MessageSquare", when: "Minute 0", label: "Told EcomAI: “a modern clean-skincare store.”" },
      { icon: "Wand2", when: "Minute 15", label: "EcomAI built the store — brand, products, copy & SEO." },
      { icon: "Rocket", when: "Day 1", label: "Launched to her own domain, payments ready." },
      { icon: "TrendingUp", when: "Day 30", label: "First month of sales, with EcomAI optimizing ads." },
    ],
    result: "~$3,200 in the first 30 days",
  },
  {
    name: "Bilal",
    initials: "B",
    niche: "Streetwear fashion",
    emoji: "🧥",
    summary: "Had a brand idea but no time to build a website or find suppliers.",
    beats: [
      { icon: "MessageSquare", when: "Minute 0", label: "Described a bold streetwear label to EcomAI." },
      { icon: "Boxes", when: "Minute 5", label: "Matched with verified suppliers and best-sellers." },
      { icon: "Wand2", when: "Minute 20", label: "A full storefront generated — mobile-ready." },
      { icon: "TrendingUp", when: "Day 45", label: "Scaling with AI-written SEO and bundles." },
    ],
    result: "~$7,800/mo by month two",
  },
  {
    name: "Aisha",
    initials: "A",
    niche: "Home decor",
    emoji: "🪴",
    summary: "Selling on marketplaces, wanted her own branded store.",
    beats: [
      { icon: "MessageSquare", when: "Minute 0", label: "Asked EcomAI to rebuild her catalog as a brand." },
      { icon: "Wand2", when: "Minute 12", label: "New store, refreshed product copy & imagery." },
      { icon: "Rocket", when: "Day 1", label: "Migrated her domain and went live." },
      { icon: "TrendingUp", when: "Day 30", label: "Higher margins selling direct, not per-marketplace." },
    ],
    result: "42% average margin, direct-to-customer",
  },
  {
    name: "Marco",
    initials: "M",
    niche: "Specialty coffee",
    emoji: "☕",
    summary: "A roaster who wanted to sell online without hiring an agency.",
    beats: [
      { icon: "MessageSquare", when: "Minute 0", label: "Told EcomAI: “a subscription coffee store.”" },
      { icon: "Wand2", when: "Minute 18", label: "Store + subscription flow generated end to end." },
      { icon: "Rocket", when: "Day 1", label: "Launched with recurring billing configured." },
      { icon: "TrendingUp", when: "Day 30", label: "Steady repeat orders from subscribers." },
    ],
    result: "~180 subscribers in month one",
  },
];
