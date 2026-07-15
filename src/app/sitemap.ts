import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

const routes = [
  "", "/services", "/how-it-works", "/suppliers", "/store-owners",
  "/ai-platform", "/store-gallery", "/why-ecomstrait", "/about",
  "/resources", "/contact", "/privacy", "/terms", "/cookies",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((path) => ({
    url: `${siteConfig.url}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
