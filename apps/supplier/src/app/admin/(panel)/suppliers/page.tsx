import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { createAdminClient } from "@ecomstrait/db";
import type { SupplierStatus } from "@ecomstrait/db/types";

export const metadata: Metadata = { title: "Suppliers — Admin" };

const STATUS_STYLE: Record<SupplierStatus, string> = {
  pending: "bg-ink-100 text-ink-500",
  in_review: "bg-amber-50 text-amber-700",
  approved: "bg-brand-50 text-brand-700",
  rejected: "bg-red-50 text-red-600",
};

// Review queue first.
const ORDER: Record<SupplierStatus, number> = {
  in_review: 0,
  pending: 1,
  approved: 2,
  rejected: 3,
};

export default async function AdminSuppliersPage() {
  const client = createAdminClient();
  if (!client) {
    return <p className="text-sm text-red-600">Server is not configured (missing service role key).</p>;
  }

  const { data } = await client
    .from("suppliers")
    .select("id, business_name, contact_person, country, status, created_at")
    .order("created_at", { ascending: false });

  const suppliers = (data ?? []).sort((a, b) => ORDER[a.status] - ORDER[b.status]);
  const reviewCount = suppliers.filter((s) => s.status === "in_review").length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-950">Suppliers</h1>
      <p className="mt-1 text-sm text-ink-500">
        {reviewCount > 0
          ? `${reviewCount} application${reviewCount === 1 ? "" : "s"} awaiting review.`
          : "No applications awaiting review."}
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-ink-100 bg-white">
        {suppliers.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-400">No suppliers yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-400">
                <th className="px-4 py-3 font-medium">Business</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Contact</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Country</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="border-b border-ink-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink-900">
                    {s.business_name || <span className="text-ink-400">Unnamed</span>}
                  </td>
                  <td className="hidden px-4 py-3 text-ink-500 sm:table-cell">
                    {s.contact_person ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-ink-500 md:table-cell">{s.country ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[s.status]}`}>
                      {s.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/suppliers/${s.id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-ai-600 hover:underline"
                    >
                      Review <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
