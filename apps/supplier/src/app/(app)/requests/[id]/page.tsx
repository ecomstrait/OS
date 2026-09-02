import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Mail, Phone, Clock, Truck } from "lucide-react";
import { createClient } from "@ecomstrait/auth/server";
import type { RequestItem, RequestMessage } from "@ecomstrait/db/types";
import { REQUEST_STATUS_STYLE } from "@/lib/request-status";
import { RequestStatusActions } from "@/components/requests/request-status-actions";
import { MessageThread } from "@/components/requests/message-thread";

export const metadata: Metadata = { title: "Request" };

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS scopes this to the caller's own requests.
  const { data: request } = await supabase
    .from("product_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!request) notFound();

  const { data: items } = await supabase
    .from("request_items")
    .select("*")
    .eq("request_id", id);

  const { data: messages } = await supabase
    .from("request_messages")
    .select("*")
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  const { data: order } =
    request.status === "accepted"
      ? await supabase.from("orders").select("id, number").eq("request_id", id).maybeSingle()
      : { data: null };

  const lines = (items ?? []) as RequestItem[];
  const thread = (messages ?? []) as RequestMessage[];

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/requests" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800">
        <ArrowLeft className="h-4 w-4" /> Requests
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink-950">
          {request.store_name || request.store_owner_name || "Store owner"}
        </h1>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${REQUEST_STATUS_STYLE[request.status]}`}>
          {request.status}
        </span>
      </div>

      {/* Meta */}
      <div className="mt-2 flex flex-wrap gap-4 text-sm text-ink-500">
        {request.store_owner_name && <span>{request.store_owner_name}</span>}
        {request.store_owner_email && (
          <span className="inline-flex items-center gap-1.5">
            <Mail className="h-4 w-4" /> {request.store_owner_email}
          </span>
        )}
        {request.store_owner_phone && (
          <span className="inline-flex items-center gap-1.5">
            <Phone className="h-4 w-4" /> {request.store_owner_phone}
          </span>
        )}
        {request.timeline && (
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> {request.timeline}
          </span>
        )}
      </div>

      {/* Requested items */}
      <section className="mt-6 rounded-2xl border border-ink-100 bg-white p-5">
        <h2 className="text-sm font-semibold text-ink-950">Requested products</h2>
        <ul className="mt-3 divide-y divide-ink-50">
          {lines.length === 0 && <li className="py-2 text-sm text-ink-400">No line items.</li>}
          {lines.map((it) => (
            <li key={it.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-ink-800">{it.product_name}</span>
              <span className="font-medium text-ink-600">Qty {it.quantity}</span>
            </li>
          ))}
        </ul>
        {request.note && (
          <p className="mt-4 rounded-xl bg-ink-50 p-3 text-sm text-ink-600">
            <span className="font-medium text-ink-800">Note: </span>
            {request.note}
          </p>
        )}
        {request.shipping && (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-ink-50 p-3 text-sm text-ink-600">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
            <span>
              <span className="font-medium text-ink-800">Ships to: </span>
              {request.shipping}
            </span>
          </p>
        )}
      </section>

      {/* Actions */}
      <section className="mt-4 rounded-2xl border border-ink-100 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink-950">Respond</h2>
        {request.status === "accepted" && order ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-50 px-4 py-3">
            <p className="text-sm text-ink-700">
              Accepted — order{" "}
              <span className="font-semibold text-ink-950">#{order.number}</span> created.
            </p>
            <Link
              href={`/orders/${order.id}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
            >
              View order <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <RequestStatusActions requestId={request.id} status={request.status} />
        )}
      </section>

      {/* Thread */}
      <section className="mt-4 rounded-2xl border border-ink-100 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink-950">Conversation</h2>
        <MessageThread requestId={request.id} messages={thread} />
      </section>
    </div>
  );
}
