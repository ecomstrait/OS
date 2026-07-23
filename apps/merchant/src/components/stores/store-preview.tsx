"use client";

import { useState } from "react";
import { Copy, Check, Eye, EyeOff } from "lucide-react";

/**
 * Preview link for a Shopify dev store plus its storefront password (dev stores
 * are password-locked). The password is set by the platform admin; the merchant
 * copies it to unlock the storefront preview.
 */
export function StorePreview({
  url,
  password,
}: {
  url: string;
  password: string | null;
}) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);

  function copy() {
    if (!password) return;
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="flex items-center gap-2">
      {password && (
        <div className="flex items-center gap-1 rounded-lg border border-ink-200 bg-ink-50 px-2 py-1">
          <span className="text-[11px] font-medium text-ink-400">Password</span>
          <code className="font-mono text-xs text-ink-700">
            {shown ? password : "••••••"}
          </code>
          <button
            type="button"
            onClick={() => setShown((v) => !v)}
            className="text-ink-400 hover:text-ink-700"
            aria-label={shown ? "Hide password" : "Show password"}
          >
            {shown ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={copy}
            className="text-ink-400 hover:text-ink-700"
            aria-label="Copy password"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-brand-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      )}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-semibold text-brand-600 hover:underline"
      >
        Preview store ↗
      </a>
    </div>
  );
}
