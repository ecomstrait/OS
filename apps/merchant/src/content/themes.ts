/** Store themes shown in the gallery. Beta: browse-only; applied in the builder. */
export type StoreTheme = {
  id: string;
  name: string;
  tagline: string;
  style: string;
  gradient: string;
};

export const storeThemes: StoreTheme[] = [
  { id: "aurora", name: "Aurora", tagline: "Modern & minimal", style: "Clean, spacious, conversion-first", gradient: "linear-gradient(135deg,#10b981,#3b82f6)" },
  { id: "noir", name: "Noir", tagline: "Luxury & bold", style: "Dark, premium, high-contrast", gradient: "linear-gradient(135deg,#0f172a,#334155)" },
  { id: "bloom", name: "Bloom", tagline: "Playful & bright", style: "Colorful, friendly, lifestyle", gradient: "linear-gradient(135deg,#f472b6,#8b5cf6)" },
  { id: "cove", name: "Cove", tagline: "Calm & editorial", style: "Soft, magazine-style, storytelling", gradient: "linear-gradient(135deg,#38bdf8,#6366f1)" },
  { id: "forge", name: "Forge", tagline: "Bold & industrial", style: "Strong type, utilitarian, gear-ready", gradient: "linear-gradient(135deg,#f59e0b,#ef4444)" },
  { id: "marble", name: "Marble", tagline: "Elegant & premium", style: "Neutral, refined, timeless", gradient: "linear-gradient(135deg,#e5e9f2,#9daed0)" },
];
