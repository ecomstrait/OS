import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@ecomstrait/db";
import { getStripe, planForPrice, mapStripeStatus, periodEndIso } from "@/lib/stripe";

/**
 * Optional — the Billing page reconciles from Stripe on load, so a webhook isn't
 * required. Wire STRIPE_WEBHOOK_SECRET when you want real-time plan updates.
 */
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

  async function apply(subscriptionId: string, customerId: string) {
    const sub = await stripe!.subscriptions.retrieve(subscriptionId);
    await admin!
      .from("subscriptions")
      .update({
        plan: planForPrice(sub.items.data[0]?.price.id) ?? "free",
        status: mapStripeStatus(sub.status),
        stripe_subscription_id: sub.id,
        current_period_end: periodEndIso(sub),
      })
      .eq("stripe_customer_id", customerId);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      if (s.subscription && s.customer) await apply(String(s.subscription), String(s.customer));
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      await apply(sub.id, String(sub.customer));
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await admin
        .from("subscriptions")
        .update({ plan: "free", status: "canceled" })
        .eq("stripe_customer_id", String(sub.customer));
      break;
    }
  }

  return NextResponse.json({ ok: true });
}
