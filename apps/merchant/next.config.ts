import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ecomstrait/ui", "@ecomstrait/auth", "@ecomstrait/db"],
};

export default nextConfig;
