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

export type SupplierPlanEntitlement = {
  tier: PlanTier;
  label: string;
  /** Monthly price in USD (0 for free). */
  priceMonthly: number;
  /** Daily AI-token allowance. */
  tokensPerDay: number;
  /** Max number of products in the catalog. `null` = unlimited. */
  productLimit: number | null;
};

/**
 * Single source of truth for supplier plan limits — same shape as
 * `PLAN_ENTITLEMENTS`, but a catalog-size cap (`productLimit`) instead of a
 * store cap, since suppliers list products, not stores.
 *
 * `priceMonthly` mirrors the merchant plan's dollar amounts exactly — no
 * supplier-specific pricing was specified, so this is a placeholder; change
 * these three numbers here if supplier pricing should differ.
 */
export const SUPPLIER_PLAN_ENTITLEMENTS: Record<PlanTier, SupplierPlanEntitlement> = {
  free: { tier: "free", label: "Free", priceMonthly: 0, tokensPerDay: 10_000, productLimit: 100 },
  basic: { tier: "basic", label: "Basic", priceMonthly: 10, tokensPerDay: 50_000, productLimit: 500 },
  premium: { tier: "premium", label: "Premium", priceMonthly: 30, tokensPerDay: 1_000_000, productLimit: 10_000 },
  full: { tier: "full", label: "Full", priceMonthly: 100, tokensPerDay: 10_000_000, productLimit: null },
};
