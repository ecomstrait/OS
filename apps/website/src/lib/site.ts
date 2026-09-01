/**
 * Global site configuration — navigation, footer, and metadata.
 * Structured so it can later be sourced from Sanity CMS with the same shape.
 */

export const siteConfig = {
  name: "EcomStrait",
  tagline: "Your AI ecommerce co-founder — build, launch, and grow.",
  description:
    "EcomStrait is your AI ecommerce co-founder. Describe your business and EcomAI builds your online store, finds verified suppliers, writes your SEO, and helps you grow — no inventory, no code, no agencies.",
  url: "https://ecomstrait.com",
  email: "ecomstrait@gmail.com",
  whatsapp: "+92 (309) 7418788",
  socials: {
    twitter: "https://twitter.com/ecomstrait",
    linkedin: "https://linkedin.com/company/ecomstrait",
    instagram: "https://instagram.com/ecomstrait",
    youtube: "https://youtube.com/@ecomstrait",
  },
} as const;

/**
 * The Supplier Portal is a separate app/deployment. Configurable per
 * environment via NEXT_PUBLIC_SUPPLIER_APP_URL (falls back to local dev).
 */
export const supplierAppUrl =
  process.env.NEXT_PUBLIC_SUPPLIER_APP_URL || "http://localhost:3001";
export const supplierSignupUrl = `${supplierAppUrl}/signup`;

/**
 * The Merchant Portal is a separate app/deployment — every "Build My
 * Business" CTA sends entrepreneurs there to actually sign up and build,
 * rather than to the (currently hidden) on-site AI builder demo. Configurable
 * per environment via NEXT_PUBLIC_MERCHANT_APP_URL, so attaching a custom
 * domain later is an env change, never a code change.
 */
export const merchantAppUrl =
  process.env.NEXT_PUBLIC_MERCHANT_APP_URL || "http://localhost:3002";
export const merchantSignupUrl = `${merchantAppUrl}/signup`;

export type NavItem = { label: string; href: string };

export const primaryNav: NavItem[] = [
  { label: "The Problem", href: "/problem" },
  { label: "Services", href: "/services" },
  { label: "Suppliers", href: "/suppliers" },
  { label: "Entrepreneur", href: "/store-owners" },
  { label: "Ask EcomAI", href: "/faq" },
  { label: "Why EcomStrait", href: "/why-ecomstrait" },
];

export const secondaryNav: NavItem[] = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "About", href: "/about" },
  { label: "Resources", href: "/resources" },
  { label: "Contact", href: "/contact" },
];

export const footerNav: { title: string; links: NavItem[] }[] = [
  {
    title: "Platform",
    links: [
      { label: "Services", href: "/services" },
      { label: "The Problem", href: "/problem" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Why EcomStrait", href: "/why-ecomstrait" },
    ],
  },
  {
    title: "For You",
    links: [
      { label: "Become a Supplier", href: supplierSignupUrl },
      { label: "Build a Business", href: merchantSignupUrl },
      { label: "Book a Demo", href: "/contact" },
      { label: "Pricing", href: "/store-owners#pricing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "/resources" },
      { label: "Help Center", href: "/resources" },
      { label: "Ask EcomAI", href: "/faq" },
      { label: "Success Stories", href: "/why-ecomstrait#stories" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
    ],
  },
];
