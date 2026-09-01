import { NextResponse } from "next/server";
import { upsertEmbeddings } from "@ecomstrait/ai";
import { niches } from "@/content/niches";

/**
 * One-off / re-run-on-demand: embeds the niche knowledge base into
 * `ai_embeddings` (source_type "niche_kb") so it's retrievable for RAG. Not
 * wired into any build step — invoke by hand after editing niches.ts.
 *
 * Gated by SUPABASE_SERVICE_ROLE_KEY as a shared secret rather than a new
 * env var — it's already a private, server-only secret nothing else exposes,
 * and this route has no other reason to be called by anyone but us.
 */
export async function POST(req: Request) {
  const auth = req.headers.get("x-admin-secret");
  const expected = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!expected || auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sources = niches.map((n) => ({
    sourceType: "niche_kb",
    sourceId: n.slug,
    content: [
      `Niche: ${n.label}`,
      `Keywords: ${n.keywords.join(", ")}`,
      `Margin: ${n.margin[0]}-${n.margin[1]}%`,
      `Suppliers: ${n.suppliers[0]}-${n.suppliers[1]}`,
      `Monthly revenue: $${n.monthlyRevenue[0]}-$${n.monthlyRevenue[1]}`,
      `Product ideas: ${n.productIdeas.join(", ")}`,
      `Typical countries: ${n.countries.join(", ")}`,
    ].join("\n"),
  }));

  try {
    await upsertEmbeddings(sources);
    return NextResponse.json({ ok: true, embedded: sources.length });
  } catch (err) {
    console.error("[seed-niche-kb]", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
