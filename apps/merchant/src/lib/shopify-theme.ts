import { shopifyGraphql } from "@/lib/shopify";

/** Theme settings we override per store (written to config/settings_data.json). */
export type ThemeSettings = Record<string, string | number>;

const THEME_CREATE = `
mutation themeCreate($name: String!, $source: URL!) {
  themeCreate(name: $name, source: $source) {
    theme { id name }
    userErrors { field message }
  }
}`;

const THEME_STATUS = `
query themeStatus($id: ID!) {
  theme(id: $id) { id processing }
}`;

const THEME_FILES_UPSERT = `
mutation themeFilesUpsert($themeId: ID!, $files: [OnlineStoreThemeFilesUpsertFileInput!]!) {
  themeFilesUpsert(themeId: $themeId, files: $files) {
    upsertedThemeFiles { filename }
    userErrors { filename message }
  }
}`;

const THEME_PUBLISH = `
mutation themePublish($id: ID!) {
  themePublish(id: $id) {
    theme { id }
    userErrors { message }
  }
}`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Overwrite a theme's `settings_data.json` (colors, hero, fonts) and, if given,
 * upload the merchant logo into `assets/` — on an EXISTING theme. This is the
 * live re-sync used after EcomAI cosmetic edits; no create/publish.
 */
export async function pushThemeSettings(
  shop: string,
  token: string,
  themeGid: string,
  settings: ThemeSettings,
  logo?: { url: string; filename: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gql = shopifyGraphql(shop, token);
  const next: ThemeSettings = { ...settings };
  const files: { filename: string; body: { type: string; value: string } }[] = [];
  if (logo) {
    next.logo_asset = logo.filename;
    files.push({ filename: `assets/${logo.filename}`, body: { type: "URL", value: logo.url } });
  }
  files.push({
    filename: "config/settings_data.json",
    body: { type: "TEXT", value: JSON.stringify({ current: next }) },
  });

  const res = await gql<UpsertResp>(THEME_FILES_UPSERT, { themeId: themeGid, files });
  const errs = res.data?.themeFilesUpsert?.userErrors ?? [];
  if (errs.length) return { ok: false, error: errs.map((e) => e.message).join("; ") };
  return { ok: true };
}

type CreateResp = {
  data?: { themeCreate?: { theme?: { id: string } | null; userErrors?: { message: string }[] } };
};
type StatusResp = { data?: { theme?: { processing?: boolean } | null } };
type UpsertResp = { data?: { themeFilesUpsert?: { userErrors?: { message: string }[] } } };
type PublishResp = { data?: { themePublish?: { userErrors?: { message: string }[] } } };

/**
 * Upload our Liquid theme to a Shopify store, apply the store's brand settings,
 * and publish it. `sourceUrl` must be a publicly reachable zip (our /api/themes
 * endpoint). Best-effort processing wait before publish. Requires write_themes.
 */
export async function uploadAndPublishTheme(
  shop: string,
  token: string,
  opts: {
    themeName: string;
    sourceUrl: string;
    settings: ThemeSettings;
    /** Merchant logo — uploaded into the theme's assets/ and shown in the header. */
    logo?: { url: string; filename: string };
    publish?: boolean;
  },
): Promise<{ ok: true; themeGid: string } | { ok: false; error: string }> {
  const gql = shopifyGraphql(shop, token);

  // 1. Create the theme from the hosted zip.
  const created = await gql<CreateResp>(THEME_CREATE, { name: opts.themeName, source: opts.sourceUrl });
  const createErrs = created.data?.themeCreate?.userErrors ?? [];
  const gid = created.data?.themeCreate?.theme?.id;
  if (!gid) {
    return { ok: false, error: createErrs.map((e) => e.message).join("; ") || "themeCreate failed" };
  }

  // 2. Wait for Shopify to finish unpacking (best-effort).
  for (let i = 0; i < 8; i++) {
    const st = await gql<StatusResp>(THEME_STATUS, { id: gid });
    if (st.data?.theme && !st.data.theme.processing) break;
    await sleep(1500);
  }

  // 3. Push the brand settings + logo asset onto the freshly-created theme.
  const applied = await pushThemeSettings(shop, token, gid, opts.settings, opts.logo);
  if (!applied.ok) return applied;

  // 4. Publish so the storefront uses it.
  if (opts.publish !== false) {
    const pub = await gql<PublishResp>(THEME_PUBLISH, { id: gid });
    const pubErrs = pub.data?.themePublish?.userErrors ?? [];
    if (pubErrs.length) return { ok: false, error: pubErrs.map((e) => e.message).join("; ") };
  }

  return { ok: true, themeGid: gid };
}

const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "svg", "webp"];

/** Build the logo asset descriptor from a stored logo URL (or undefined). */
export function logoAssetFrom(logoUrl: string | null | undefined): { url: string; filename: string } | undefined {
  if (!logoUrl) return undefined;
  const ext = (logoUrl.split("?")[0].split(".").pop() || "png").toLowerCase();
  const safeExt = IMAGE_EXTS.includes(ext) ? ext : "png";
  return { url: logoUrl, filename: `logo.${safeExt}` };
}

/** Map a store's saved plan (stores.content) to Liquid theme settings. */
export function settingsFromPlan(
  plan: { brandColors?: string[]; heroHeadline?: string; heroSub?: string; tagline?: string } | null,
): ThemeSettings {
  const colors = plan?.brandColors ?? [];
  return {
    color_brand: colors[0] || "#10b981",
    color_accent: colors[1] || colors[0] || "#3b82f6",
    color_text: colors[2] || "#0f172a",
    color_bg: "#ffffff",
    hero_heading: plan?.heroHeadline || "Your brand, beautifully built",
    hero_subheading: plan?.heroSub || "Curated products, fast shipping, and a store designed to convert.",
    hero_cta: "Shop now",
    footer_text: plan?.tagline || "Powered by EcomStrait",
  };
}
