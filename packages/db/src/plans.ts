import type { PlanTier } from "./types";

export type PlanEntitlement = {
  tier: PlanTier;
  label: string;
  /** Monthly price in USD (0 for free). */
  priceMonthly: number;
  /** Daily AI-token allowance. */
  tokensPerDay: number;
  /** Max number of stores. */
  storeLimit: number;
};

/** Single source of truth for plan limits (Doc 18 / entrepreneur plan). */
export const PLAN_ENTITLEMENTS: Record<PlanTier, PlanEntitlement> = {
  free: { tier: "free", label: "Free", priceMonthly: 0, tokensPerDay: 10_000, storeLimit: 1 },
  basic: { tier: "basic", label: "Basic", priceMonthly: 10, tokensPerDay: 50_000, storeLimit: 2 },
  premium: { tier: "premium", label: "Premium", priceMonthly: 30, tokensPerDay: 1_000_000, storeLimit: 10 },
  full: { tier: "full", label: "Full", priceMonthly: 100, tokensPerDay: 10_000_000, storeLimit: 50 },
};

/** Number of early users who get all features free for a month. */
export const PROMO_USER_LIMIT = 100;

export const PLAN_ORDER: PlanTier[] = ["free", "basic", "premium", "full"];
