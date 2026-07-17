import { getSupabase } from "@/lib/supabase";

/**
 * Theme proxy — streams files from the PRIVATE Supabase "themes" bucket.
 *
 * The AI-Builder iframes load `/api/theme/<name>/index.html`; the theme's own
 * relative asset requests (css/js/img) resolve to `/api/theme/<name>/...` and
 * are served here too. The bucket stays private (service-role only), so the
 * themes are never in git and never directly browsable — only through this proxy.
 */

const BUCKET = "themes";

const MIME: Record<string, string> = {
  html: "text/html; charset=utf-8", htm: "text/html; charset=utf-8", css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8", mjs: "text/javascript; charset=utf-8", json: "application/json",
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif",
  webp: "image/webp", avif: "image/avif", svg: "image/svg+xml", ico: "image/x-icon",
  woff: "font/woff", woff2: "font/woff2", ttf: "font/ttf", otf: "font/otf", eot: "application/vnd.ms-fontobject",
  mp4: "video/mp4", webm: "video/webm", mp3: "audio/mpeg", txt: "text/plain", map: "application/json",
};

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const key = (path ?? []).join("/");

  // Path safety — no traversal, no absolute paths.
  if (!key || key.includes("..") || key.startsWith("/")) {
    return new Response("Bad request", { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return new Response("Storage not configured", { status: 500 });
  }

  const { data, error } = await supabase.storage.from(BUCKET).download(key);
  if (error || !data) {
    return new Response("Not found", { status: 404 });
  }

  const buffer = await data.arrayBuffer();
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  const contentType = MIME[ext] || data.type || "application/octet-stream";

  // HTML documents shouldn't be cached hard (theme swaps); assets can be.
  const isHtml = ext === "html" || ext === "htm";
  const cache = isHtml
    ? "public, max-age=0, must-revalidate"
    : "public, max-age=3600, s-maxage=86400, immutable";

  return new Response(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": cache,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
