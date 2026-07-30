"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  KeyRound,
  Loader2,
  MoreHorizontal,
  PackagePlus,
  RefreshCw,
  Sparkles,
  Store,
  Trash2,
} from "lucide-react";
import { cn } from "@ecomstrait/ui";
import { provisionShopifyStore, resyncShopifyTheme, syncProductsToShopify } from "@/lib/shopify-actions";
import { DeleteStoreButton } from "@/components/stores/delete-store-button";
import { MakeItYoursButton } from "@/components/stores/make-it-yours-button";

type Props = {
  storeId: string;
  storeName: string;
  needsProvision: boolean;
  isLinked: boolean;
  hasShopify: boolean;
  isLiquidTheme: boolean;
  hasOrders: boolean;
  referralUrl: string;
  transferEmail: string | null;
  transferred: boolean;
};

const MENU_WIDTH = 224;

/**
 * Actions menu for a store row.
 *
 * The menu renders through a portal with fixed positioning: the rows list has
 * `overflow-hidden` for its rounded corners, which clipped an absolutely
 * positioned menu, and each row created its own stacking context so later rows
 * painted over it. A portal escapes both without the list having to change.
 */
export function StoreActions({
  storeId,
  storeName,
  needsProvision,
  isLinked,
  hasShopify,
  isLiquidTheme,
  hasOrders,
  referralUrl,
  transferEmail,
  transferred,
}: Props) {
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [dialog, setDialog] = useState<"delete" | "transfer" | null>(null);

  const open = coords !== null;

  /** Anchor the menu to the trigger, flipping up when it would run off-screen. */
  function openMenu() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const estimatedHeight = 260;
    const below = window.innerHeight - rect.bottom;
    const top = below < estimatedHeight ? rect.top - estimatedHeight - 4 : rect.bottom + 4;
    setCoords({
      top: Math.max(8, top),
      left: Math.max(8, rect.right - MENU_WIDTH),
    });
  }

  // A fixed menu would detach from its trigger on scroll or resize.
  useEffect(() => {
    if (!open) return;
    const close = () => setCoords(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function run(fn: () => Promise<{ error?: string; note?: string; ok?: boolean }>) {
    setMessage(null);
    setCoords(null);
    start(async () => {
      const res = await fn();
      setIsError(Boolean(res.error));
      setMessage(res.error ?? res.note ?? "Done.");
      if (!res.error) router.refresh();
    });
  }

  const item =
    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-50";

  const menu = open && coords && (
    <>
      <div className="fixed inset-0 z-[60]" onClick={() => setCoords(null)} />
      <div
        role="menu"
        style={{ position: "fixed", top: coords.top, left: coords.left, width: MENU_WIDTH }}
        className="z-[61] overflow-hidden rounded-xl border border-ink-200 bg-white py-1 shadow-xl"
      >
        <Link href={`/stores/${storeId}/edit`} className={item} role="menuitem">
          <Sparkles className="h-4 w-4" /> Edit with EcomAI
        </Link>

        {needsProvision && (
          <button
            role="menuitem"
            className={item}
            onClick={() => run(() => provisionShopifyStore(storeId))}
          >
            <Store className="h-4 w-4" />
            {isLinked ? "Retry provisioning" : "Provision on Shopify"}
          </button>
        )}

        {hasShopify && (
          <button
            role="menuitem"
            className={item}
            onClick={() => run(() => syncProductsToShopify(storeId))}
          >
            <PackagePlus className="h-4 w-4" /> Sync products
          </button>
        )}

        {hasShopify && isLiquidTheme && (
          <button
            role="menuitem"
            className={item}
            onClick={() => run(() => resyncShopifyTheme(storeId))}
          >
            <RefreshCw className="h-4 w-4" /> Update live store
          </button>
        )}

        {hasShopify && !transferred && !transferEmail && (
          <button
            role="menuitem"
            className={item}
            onClick={() => {
              setCoords(null);
              setDialog("transfer");
            }}
          >
            <KeyRound className="h-4 w-4" /> Make it yours
          </button>
        )}

        <div className="my-1 border-t border-ink-100" />

        <button
          role="menuitem"
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
          onClick={() => {
            setCoords(null);
            setDialog("delete");
          }}
        >
          <Trash2 className="h-4 w-4" /> {hasOrders ? "Archive store" : "Delete store"}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex items-center gap-2">
      {message && (
        <span
          title={message}
          className={cn("max-w-[16rem] truncate text-xs", isError ? "text-red-600" : "text-ink-500")}
        >
          {message}
        </span>
      )}

      <button
        ref={triggerRef}
        onClick={() => (open ? setCoords(null) : openMenu())}
        disabled={pending}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-semibold text-ink-700 transition hover:bg-ink-50 disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <MoreHorizontal className="h-3.5 w-3.5" />
        )}
        Actions
        <ChevronDown className="h-3 w-3" />
      </button>

      {typeof document !== "undefined" && menu ? createPortal(menu, document.body) : null}

      {/* Dialogs sit outside the menu — otherwise dismissing the menu on an
          outside click would unmount the dialog the merchant just opened. */}
      <DeleteStoreButton
        storeId={storeId}
        storeName={storeName}
        hasOrders={hasOrders}
        hideTrigger
        controlledOpen={dialog === "delete"}
        onClose={() => setDialog(null)}
        onDone={() => setDialog(null)}
      />
      <MakeItYoursButton
        storeId={storeId}
        referralUrl={referralUrl}
        requestedEmail={transferEmail}
        transferred={transferred}
        hideTrigger
        controlledOpen={dialog === "transfer"}
        onClose={() => setDialog(null)}
        onDone={() => setDialog(null)}
      />
    </div>
  );
}
