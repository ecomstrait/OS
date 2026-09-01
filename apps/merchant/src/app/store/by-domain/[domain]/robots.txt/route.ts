export const runtime = "nodejs";

/** robots.txt for a merchant's connected domain — see the sitemap route alongside this one. */
export async function GET(_req: Request, { params }: { params: Promise<{ domain: string }> }) {
  const { domain: rawDomain } = await params;
  const domain = decodeURIComponent(rawDomain);
  const body = `User-agent: *\nAllow: /\nSitemap: https://${domain}/sitemap.xml\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain" } });
}
