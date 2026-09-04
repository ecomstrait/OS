import type { NextConfig } from "next";

// Every storefront image (product photos, store logos, hero/about/gallery
// media) is uploaded to one of this Supabase project's public storage
// buckets (product-images, store-logos, store-assets, ...) and served from
// `${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/<bucket>/...` — one
// host, so one remotePattern covers all of it for `next/image`.
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return undefined;
  }
})();

const nextConfig: NextConfig = {
  transpilePackages: ["@ecomstrait/ui", "@ecomstrait/auth", "@ecomstrait/db"],
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default nextConfig;
