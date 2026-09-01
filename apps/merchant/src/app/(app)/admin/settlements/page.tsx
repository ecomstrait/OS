import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@ecomstrait/auth/server";
import { MarkPaidButton } from "@/components/admin/mark-paid-button";

export const metadata: Metadata = { title: "Settlements" };

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

function when(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Weekly settlement batches (Docs/Credits-Settlement-Plan.md, §4). Manual MVP
 * per §1 open decision #3: this lists what each run totaled and lets an
 * admin mark it paid once they've sent the money by bank transfer — there's
 * no automated payout rail yet.
 */
export default async function SettlementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) notFound();

  const { data: batches } = await supabase
    .from("settlement_batches")
    .select("*")
    .order("run_at", { ascending: false });

  const list = batches ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-ink-950">Settlements</h1>
      <p className="mt-1 text-sm text-ink-500">
        Weekly batches of what EcomStrait owes merchants and suppliers. Pay by bank transfer, then
        mark the batch paid.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-ink-100 bg-white">
        {list.length === 0 ? (
          <p className="p-6 text-sm text-ink-500">No settlement batches yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-400">
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 text-right font-medium">To merchants</th>
                <th className="px-4 py-3 text-right font-medium">To suppliers</th>
                <th className="px-4 py-3 text-right font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {list.map((b) => (
                <tr key={b.id} className="border-b border-ink-50 last:border-0">
                  <td className="px-4 py-3 text-ink-700">
                    {when(b.period_start)} – {when(b.period_end)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-ink-900">
                    {money(b.total_to_merchants)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-ink-900">
                    {money(b.total_to_suppliers)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={
                        b.status === "paid"
                          ? "rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700"
                          : "rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                      }
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {b.status === "draft" && <MarkPaidButton batchId={b.id} />}
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
