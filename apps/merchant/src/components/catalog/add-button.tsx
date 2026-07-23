"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Loader2 } from "lucide-react";
import { cn } from "@ecomstrait/ui";
import { addSelectedProduct, removeSelectedProduct } from "@/lib/catalog-actions";

export function AddButton({ productId, selected }: { productId: string; selected: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function toggle() {
    start(async () => {
      if (selected) await removeSelectedProduct(productId);
      else await addSelectedProduct(productId);
      router.refresh();
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={cn(
        "inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition disabled:opacity-60",
        selected
          ? "border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100"
          : "bg-brand-500 text-white hover:bg-brand-600",
      )}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : selected ? (
        <>
          <Check className="h-4 w-4" /> Added
        </>
      ) : (
        <>
          <Plus className="h-4 w-4" /> Add
        </>
      )}
    </button>
  );
}
