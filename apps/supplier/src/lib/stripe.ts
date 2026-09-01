import Stripe from "stripe";

/** Server-only Stripe client. Null when no key (degrade gracefully in dev). */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key) : null;
}

export function supplierUrl(): string {
  return process.env.NEXT_PUBLIC_SUPPLIER_URL || "http://localhost:3001";
}
