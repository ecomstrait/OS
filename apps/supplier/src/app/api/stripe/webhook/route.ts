import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@ecomstrait/db";
import { creditWallet, releaseHeldOrders } from "@ecomstrait/db/wallet";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

/** Credits a supplier's wallet once their top-up Checkout session completes. */
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  if (!stripe || !secret || !sig) return NextResponse.json({ ok: false }, { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: true });

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    if (s.metadata?.purpose === "wallet_topup" && s.metadata.supplier_id && s.amount_total) {
      const amount = s.amount_total / 100;
      await creditWallet(admin, amount, {
        accountType: "supplier",
        accountId: s.metadata.supplier_id,
        kind: "topup",
        note: `Stripe checkout ${s.id}`,
        // A redelivered webhook, or a race against the wallet page's own
        // reconciliation fallback for this same session, must credit the
        // wallet at most once — enforced by wallet_adjust's unique index,
        // not left to chance.
        externalRef: s.id,
      });
      await releaseHeldOrders(admin, "supplier", s.metadata.supplier_id);
    }
  }

  return NextResponse.json({ ok: true });
}
