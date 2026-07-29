import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";

// The Vercel preset emits the .vercel/output build. Only apply it on Vercel so
// that `shopify app dev` and local `react-router build` stay unchanged.
export default {
  ssr: true,
  presets: process.env.VERCEL ? [vercelPreset()] : [],
} satisfies Config;
