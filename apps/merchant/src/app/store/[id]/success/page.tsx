import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { createAdminClient } from "@ecomstrait/db";
import { getStripe } from "@/lib/stripe";
import { getStorefront } from "@/lib/storefront";
import { recordCustomerOrder } from "@/lib/order-sink";

export const metadata: Metadata = { title: "Thank you" };

type Addr = { name?: string | null; address?: Record<string, string | null> | null };

function formatAddr(d: Addr | null | undefined): string | null {
  if (!d) return null;
  const a = d.address ?? {};
  const parts = [
    d.name,
    [a.line1, a.line2].filter(Boolean).join(" "),
    [a.city, a.state, a.postal_code].filter(Boolean).join(" "),
    a.country,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

/** Record the paid order once (idempotent), route to suppliers, adjust stock. */
async function recordOrder(storeId: string, sessionId: string): Promise<void> {
  const stripe = getStripe();
  const admin = createAdminClient();
  if (!stripe || !admin) return;

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") return;

  const lines: { productId: string; quantity: number }[] = JSON.parse(
    (session.metadata?.lines as string) ?? "[]",
  );
  const ids = lines.map((l) => l.productId);
  if (!ids.length) return;

  const [{ data: prods }, { data: sp }] = await Promise.all([
    admin.from("products").select("id, title, retail_price, supplier_id").in("id", ids),
    admin.from("store_products").select("product_id, price").eq("store_id", storeId),
  ]);
  const priceMap = new Map((sp ?? []).map((r) => [r.product_id, r.price]));

  const items = lines.map((l) => {
    const p = (prods ?? []).find((x) => x.id === l.productId);
    return {
      product_id: l.productId,
      supplier_id: p?.supplier_id ?? null,
      name: p?.title ?? "Product",
      quantity: l.quantity,
      unit_price: priceMap.get(l.productId) ?? p?.retail_price ?? null,
    };
  });

  const cust = session.customer_details;
  const s = session as unknown as {
    shipping_details?: Addr;
    collected_information?: { shipping_details?: Addr };
  };
  const shipText =
    formatAddr(s.collected_information?.shipping_details) ??
    formatAddr(s.shipping_details) ??
    formatAddr({ name: cust?.name, address: cust?.address as unknown as Record<string, string | null> });

  await recordCustomerOrder(admin, {
    storeId,
    externalId: sessionId,
    customerName: cust?.name,
    customerEmail: cust?.email,
    shipping: shipText,
    items,
  });
}

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { id } = await params;
  const { session_id } = await searchParams;
  if (session_id) {
    try {
      await recordOrder(id, session_id);
    } catch {
      /* best-effort */
    }
  }
  const store = await getStorefront(id);

  return (
    <main className="grid min-h-screen place-items-center bg-ink-50/50 px-6 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-ink-950">Thank you for your order!</h1>
        <p className="mt-2 text-sm text-ink-500">
          Your order is confirmed{store ? ` at ${store.name}` : ""}. You&apos;ll get an email with the details, and the supplier is preparing your shipment.
        </p>
        {store && (
          <Link href={`/store/${id}`} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
            Continue shopping
          </Link>
        )}
      </div>
    </main>
  );
}
