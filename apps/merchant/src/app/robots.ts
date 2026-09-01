import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

/**
 * Root robots.txt — for the shared merchant-app host only. A store on its
 * own connected domain gets its own robots.txt at that domain's root
 * instead (see store/by-domain/[domain]/robots.txt/route.ts), since a
 * crawler always fetches robots.txt from the domain it's actually visiting.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/store/",
        disallow: [
          "/api/",
          "/dashboard",
          "/builder",
          "/settings",
          "/billing",
          "/inventory",
          "/orders",
          "/sales",
          "/stores",
          "/find-suppliers",
          "/gallery",
          "/wallet",
          "/admin",
          "/login",
          "/signup",
        ],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
