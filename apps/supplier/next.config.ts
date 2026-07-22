import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile workspace packages consumed as TypeScript source.
  transpilePackages: ["@ecomstrait/ui", "@ecomstrait/auth", "@ecomstrait/db"],
};

export default nextConfig;
