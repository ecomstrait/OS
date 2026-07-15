/**
 * Global site configuration — navigation, footer, and metadata.
 * Structured so it can later be sourced from Sanity CMS with the same shape.
 */

export const siteConfig = {
  name: "EcomStrait",
  tagline: "Turn Supplier Inventory into Sales Instantly.",
  description:
    "EcomStrait is an AI-powered Commerce Operating System that connects verified suppliers with entrepreneurs — launch a professional online store without inventory or technical expertise.",
  url: "https://ecomstrait.com",
  email: "hello@ecomstrait.com",
  whatsapp: "+1 (555) 000-0000",
  socials: {
    twitter: "https://twitter.com/ecomstrait",
    linkedin: "https://linkedin.com/company/ecomstrait",
    instagram: "https://instagram.com/ecomstrait",
    youtube: "https://youtube.com/@ecomstrait",
  },
} as const;

export type NavItem = { label: string; href: string };

export const primaryNav: NavItem[] = [
  { label: "Services", href: "/services" },
  { label: "Suppliers", href: "/suppliers" },
  { label: "Store Owners", href: "/store-owners" },
  { label: "AI Platform", href: "/ai-platform" },
  { label: "Store Gallery", href: "/store-gallery" },
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
      { label: "AI Platform", href: "/ai-platform" },
      { label: "Store Gallery", href: "/store-gallery" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Why EcomStrait", href: "/why-ecomstrait" },
    ],
  },
  {
    title: "For You",
    links: [
      { label: "Become a Supplier", href: "/suppliers" },
      { label: "Launch a Store", href: "/store-owners" },
      { label: "Book a Demo", href: "/contact" },
      { label: "Pricing", href: "/store-owners#pricing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "/resources" },
      { label: "Help Center", href: "/resources" },
      { label: "FAQs", href: "/resources#faqs" },
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
