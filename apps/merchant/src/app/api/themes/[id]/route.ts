import { buildZip } from "@/lib/zip";
import { getThemeFiles } from "@/lib/themes";

export const runtime = "nodejs";

/**
 * Serve a Liquid theme as an uncompressed zip. Shopify's `themeCreate` fetches
 * this URL, so it must be publicly reachable (set NEXT_PUBLIC_MERCHANT_URL to a
 * public host in dev — a tunnel — not localhost).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  // Shopify's themeCreate rejects a source URL that doesn't look like a zip
  // ("Src is empty"), so the path is served as /api/themes/<id>.zip too.
  const id = raw.replace(/\.zip$/i, "");
  const files = getThemeFiles(id);
  if (!files) return new Response("Theme not found", { status: 404 });

  const zip = buildZip(Object.entries(files).map(([path, content]) => ({ path, content })));
  return new Response(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${id}.zip"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
