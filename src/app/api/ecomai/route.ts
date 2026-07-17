import { NextResponse } from "next/server";
import { generateBusinessPlan, type BusinessPlan, type PlanInput } from "@/lib/ecomai";

// Small in-memory cache so repeated niches don't re-hit Groq (and stay snappy).
type CacheEntry = { plan: BusinessPlan; at: number };
const cache = new Map<string, CacheEntry>();
const TTL_MS = 10 * 60 * 1000;
const MAX_ENTRIES = 200;

export async function POST(req: Request) {
  let body: PlanInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const idea = String(body.idea ?? "").trim().slice(0, 120);
  const country = body.country ? String(body.country).trim().slice(0, 60) : undefined;
  const budget = body.budget ? String(body.budget).trim().slice(0, 40) : undefined;

  if (idea.length < 2) {
    return NextResponse.json({ error: "Tell EcomAI what you want to sell." }, { status: 400 });
  }

  const key = `${idea.toLowerCase()}|${country ?? ""}|${budget ?? ""}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return NextResponse.json(hit.plan);
  }

  const plan = await generateBusinessPlan({ idea, country, budget });

  if (cache.size >= MAX_ENTRIES) cache.clear();
  cache.set(key, { plan, at: Date.now() });

  return NextResponse.json(plan);
}
