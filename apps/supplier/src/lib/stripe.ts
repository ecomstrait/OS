import Stripe from "stripe";
import type { PlanTier, SubscriptionStatus } from "@ecomstrait/db";

/** Server-only Stripe client. Null when no key (degrade gracefully in dev). */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key) : null;
}

export function supplierUrl(): string {
  return process.env.NEXT_PUBLIC_SUPPLIER_URL || "http://localhost:3001";
}

/** Map a Stripe subscription status to our enum. */
export function mapStripeStatus(s: Stripe.Subscription.Status): SubscriptionStatus {
  switch (s) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "incomplete";
  }
}

/** current_period_end moved to the item in newer API versions — read either. */
export function periodEndIso(sub: Stripe.Subscription): string | null {
  const end =
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    (sub.items.data[0] as unknown as { current_period_end?: number })?.current_period_end;
  return end ? new Date(end * 1000).toISOString() : null;
}

/** Paid plan → Stripe price id (from env). Separate Products/Prices from the
 *  merchant app's plans — different pricing, different Stripe customers. */
export const PRICE_IDS: Record<Exclude<PlanTier, "free">, string | undefined> = {
  basic: process.env.STRIPE_PRICE_BASIC,
  premium: process.env.STRIPE_PRICE_PREMIUM,
  full: process.env.STRIPE_PRICE_FULL,
};

/** Reverse lookup: Stripe price id → plan tier. */
export function planForPrice(priceId: string | null | undefined): PlanTier | null {
  if (!priceId) return null;
  for (const [plan, id] of Object.entries(PRICE_IDS)) {
    if (id && id === priceId) return plan as PlanTier;
  }
  return null;
}
