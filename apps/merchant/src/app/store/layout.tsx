import { Playfair_Display, Lora, Oswald, Poppins, Montserrat, Assistant } from "next/font/google";

/**
 * The six theme heading/body faces referenced by `THEME_TOKENS`
 * (lib/theme-tokens.ts), loaded here — and only here — because nothing in
 * the app ever actually fetched them. Every storefront theme's `--font-*`
 * variable named a Google Font that was never loaded, so every theme
 * silently rendered system fallback fonts (Georgia/Impact/system-ui)
 * regardless of which one a merchant picked — Noir's Playfair Display never
 * once rendered on a live custom storefront.
 *
 * Scoped to /store, not the root layout: the merchant dashboard itself
 * (dashboard, billing, settings, …) never uses these faces, so it shouldn't
 * pay to fetch them on every page.
 */
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], weight: ["400", "600", "700"], display: "swap" });
const lora = Lora({ variable: "--font-lora", subsets: ["latin"], weight: ["400", "600"], display: "swap" });
const oswald = Oswald({ variable: "--font-oswald", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });
const assistant = Assistant({ variable: "--font-assistant", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

const FONT_VARS = [
  playfair.variable,
  lora.variable,
  oswald.variable,
  poppins.variable,
  montserrat.variable,
  assistant.variable,
].join(" ");

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <div className={FONT_VARS}>{children}</div>;
}
