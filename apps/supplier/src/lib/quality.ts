/**
 * Supplier Quality Score (Doc 09 · architect recommendation).
 * A 0–100 score from the signals we actually have. New suppliers aren't
 * penalised for things they haven't had a chance to do yet (no requests →
 * response/acceptance count as neutral/full).
 */

export type QualityInputs = {
  profileFilled: number;
  profileTotal: number;
  verificationDone: number;
  verificationTotal: number;
  publishedProducts: number;
  productsTotal: number;
  inStockProducts: number;
  totalRequests: number;
  respondedRequests: number;
  acceptedRequests: number;
};

export type QualityFactor = { label: string; earned: number; max: number };

export type QualityResult = {
  score: number;
  tier: "Excellent" | "Good" | "Fair" | "Needs work";
  factors: QualityFactor[];
};

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

export function computeQualityScore(i: QualityInputs): QualityResult {
  const factors: QualityFactor[] = [
    {
      label: "Profile completeness",
      max: 20,
      earned: 20 * clamp01(i.profileTotal ? i.profileFilled / i.profileTotal : 0),
    },
    {
      label: "Verification",
      max: 25,
      earned: 25 * clamp01(i.verificationTotal ? i.verificationDone / i.verificationTotal : 0),
    },
    {
      label: "Catalog depth",
      max: 15,
      earned: 15 * clamp01(Math.min(i.publishedProducts, 10) / 10),
    },
    {
      label: "Inventory health",
      max: 15,
      earned: 15 * (i.productsTotal ? clamp01(i.inStockProducts / i.productsTotal) : 1),
    },
    {
      label: "Response rate",
      max: 15,
      earned: 15 * (i.totalRequests ? clamp01(i.respondedRequests / i.totalRequests) : 1),
    },
    {
      label: "Acceptance rate",
      max: 10,
      earned: 10 * (i.respondedRequests ? clamp01(i.acceptedRequests / i.respondedRequests) : 1),
    },
  ].map((f) => ({ ...f, earned: Math.round(f.earned) }));

  const score = Math.max(0, Math.min(100, factors.reduce((s, f) => s + f.earned, 0)));
  const tier: QualityResult["tier"] =
    score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Needs work";

  return { score, tier, factors };
}

/** Fields counted for profile completeness. */
export const PROFILE_FIELDS = [
  "business_name",
  "business_type",
  "contact_person",
  "phone",
  "country",
  "city",
  "description",
] as const;
