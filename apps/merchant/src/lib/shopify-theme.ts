import { shopifyGraphql, SHOPIFY_API_VERSION } from "@/lib/shopify";

/** Theme settings we override per store (written to config/settings_data.json). */
export type ThemeSettings = Record<string, string | number>;

/**
 * Create an EMPTY theme, then push the files in.
 *
 * The obvious route — `themeCreate(source: <zip url>)` — is a dead end: Shopify
 * refuses external theme sources with "Src is empty", and does so even for its
 * own Dawn zip, so it isn't about our URL being unreachable. Creating the theme
 * empty over REST and upserting the files has the happy side effect of removing
 * the public-URL dependency entirely, so provisioning also works from localhost.
 */
async function createEmptyTheme(
  shop: string,
  token: string,
  name: string,
): Promise<{ gid: string } | { error: string }> {
  const res = await fetch(`https://${shop}/admin/api/${SHOPIFY_API_VERSION}/themes.json`, {
    method: "POST",
    headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" },
    body: JSON.stringify({ theme: { name, role: "unpublished" } }),
  });
  const body = (await res.json().catch(() => ({}))) as {
    theme?: { id?: number };
    errors?: unknown;
  };
  const id = body.theme?.id;
  if (!id) {
    return { error: `couldn't create the theme (HTTP ${res.status}): ${JSON.stringify(body.errors ?? body).slice(0, 200)}` };
  }
  return { gid: `gid://shopify/OnlineStoreTheme/${id}` };
}

/** themeFilesUpsert accepts a batch; keep batches modest for bigger themes. */
const FILE_BATCH = 20;

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

type GraphqlError = { message: string };
type StatusResp = { data?: { theme?: { processing?: boolean } | null } };
type UpsertResp = { data?: { themeFilesUpsert?: { userErrors?: { message: string }[] } } };
type PublishResp = { data?: { themePublish?: { userErrors?: { message: string }[] } } };

/**
 * Install our Liquid theme on a Shopify store, apply the store's brand
 * settings, and publish it.
 *
 * Takes the theme's files directly rather than a zip URL — see
 * createEmptyTheme for why the hosted-zip route doesn't work.
 */
export async function uploadAndPublishTheme(
  shop: string,
  token: string,
  opts: {
    themeName: string;
    /** filename -> contents, from the bundled theme package. */
    files: Record<string, string>;
    settings: ThemeSettings;
    /** Merchant logo — uploaded into the theme's assets/ and shown in the header. */
    logo?: { url: string; filename: string };
    publish?: boolean;
  },
): Promise<{ ok: true; themeGid: string } | { ok: false; error: string }> {
  const gql = shopifyGraphql(shop, token);

  const entries = Object.entries(opts.files);
  if (!entries.length) return { ok: false, error: "that theme package has no files" };

  // 1. Create an empty theme to push into.
  const created = await createEmptyTheme(shop, token, opts.themeName);
  if ("error" in created) return { ok: false, error: created.error };
  const gid = created.gid;

  // 2. Push the theme files in batches.
  for (let i = 0; i < entries.length; i += FILE_BATCH) {
    const batch = entries.slice(i, i + FILE_BATCH).map(([filename, value]) => ({
      filename,
      body: { type: "TEXT", value },
    }));
    const res = await gql<UpsertResp & { errors?: GraphqlError[] }>(THEME_FILES_UPSERT, {
      themeId: gid,
      files: batch,
    });
    const errs = [
      ...(res.data?.themeFilesUpsert?.userErrors ?? []).map((e) => e.message),
      ...(res.errors ?? []).map((e) => e.message),
    ];
    if (errs.length) return { ok: false, error: `theme files rejected: ${errs.join("; ")}` };
  }

  // 3. Wait for Shopify to finish processing, then apply brand settings + logo.
  for (let i = 0; i < 8; i++) {
    const st = await gql<StatusResp>(THEME_STATUS, { id: gid });
    if (st.data?.theme && !st.data.theme.processing) break;
    await sleep(1500);
  }

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
