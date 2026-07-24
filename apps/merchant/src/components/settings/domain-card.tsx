"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe, Loader2, CheckCircle2, Clock, Copy, Check } from "lucide-react";
import type { DnsRecord, DomainTarget } from "@/lib/domain";
import { setStoreDomain, checkStoreDomain, type DomainCheck } from "@/lib/domain-actions";
import { StoreNameField } from "@/components/settings/store-name-field";

const PATH_LABEL: Record<string, string> = {
  own_platform: "Own website",
  shopify_liquid_theme: "Shopify · EcomStrait theme",
  shopify_shopify_theme: "Shopify · Shopify theme",
};

function CopyCell({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() =>
        navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        })
      }
      className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-700 hover:text-ink-950"
      title="Copy"
    >
      {value}
      {copied ? <Check className="h-3 w-3 text-brand-600" /> : <Copy className="h-3 w-3 text-ink-300" />}
    </button>
  );
}

export function DomainCard({
  storeId,
  storeName,
  storeType,
  initialDomain,
  target,
}: {
  storeId: string;
  storeName: string;
  storeType: string;
  initialDomain: string | null;
  target: DomainTarget;
}) {
  const router = useRouter();
  const [domain, setDomain] = useState(initialDomain ?? "");
  const [saved, setSaved] = useState(initialDomain);
  const [error, setError] = useState<string | null>(null);
  const [check, setCheck] = useState<DomainCheck | null>(null);
  const [savingT, saving] = useTransition();
  const [checkingT, checking] = useTransition();

  function save() {
    setError(null);
    setCheck(null);
    saving(async () => {
      const res = await setStoreDomain(storeId, domain);
      if (res.error) setError(res.error);
      else {
        setSaved(res.domain ?? null);
        if (res.domain !== undefined) setDomain(res.domain ?? "");
        router.refresh();
      }
    });
  }

  function verify() {
    setError(null);
    checking(async () => {
      const res = await checkStoreDomain(storeId);
      if ("error" in res) setError(res.error);
      else setCheck(res);
    });
  }

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 shrink-0 text-ink-400" />
          <StoreNameField storeId={storeId} initial={storeName} />
        </div>
        <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-500">
          {PATH_LABEL[storeType] ?? storeType}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="yourbrand.com"
          className="h-9 min-w-0 flex-1 rounded-lg border border-ink-200 bg-white px-3 text-sm outline-none focus:border-ai-400"
        />
        <button
          type="button"
          onClick={save}
          disabled={savingT || domain.trim() === (saved ?? "")}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-40"
        >
          {savingT && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      {saved && (
        <div className="mt-4 rounded-xl border border-ink-100 bg-ink-50/50 p-4">
          <p className="text-xs font-semibold text-ink-700">Add these DNS records</p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-ink-400">
                <tr>
                  <th className="py-1 pr-4 font-medium">Type</th>
                  <th className="py-1 pr-4 font-medium">Host</th>
                  <th className="py-1 font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {target.records.map((r: DnsRecord) => (
                  <tr key={r.type + r.host} className="border-t border-ink-100">
                    <td className="py-1.5 pr-4 font-mono text-ink-500">{r.type}</td>
                    <td className="py-1.5 pr-4 font-mono text-ink-700">{r.host}</td>
                    <td className="py-1.5">
                      <CopyCell value={r.value} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-ink-500">{target.note}</p>

          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={verify}
              disabled={checkingT}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-ink-200 px-3 text-xs font-semibold text-ink-700 hover:bg-white disabled:opacity-40"
            >
              {checkingT ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Check DNS
            </button>
            {check &&
              (check.connected ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600">
                  <CheckCircle2 className="h-4 w-4" /> Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                  <Clock className="h-4 w-4" /> Pending — DNS not resolving to {check.expectedA} yet
                  {check.resolvedA.length ? ` (found ${check.resolvedA.join(", ")})` : ""}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
