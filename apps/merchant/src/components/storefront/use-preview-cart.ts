"use client";

import { useCallback, useMemo, useState } from "react";
import type { StorefrontProduct } from "@/lib/storefront";
import type { PricedCart, CartLine } from "@/lib/storefront-api";

/**
 * Same shape/behavior contract as `useStorefrontCart` (use-storefront.ts) —
 * `StorefrontChrome` swaps between the two by `previewMode`, so everything
 * downstream (the cart drawer, the header badge, `ProductGrid`'s "Add to
 * cart") works identically either way. Unlike the real hook, this never
 * calls `/api/storefront/[id]/cart` — a draft/unlaunched store's id would
 * be refused there the same way `getStorefront` refuses it (storefront.ts),
 * and even if it weren't, a merchant clicking around their own preview
 * shouldn't create real cart/session rows against a store nobody can
 * actually buy from yet.
 */
export function usePreviewCart(products: StorefrontProduct[]) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const cart: PricedCart = useMemo(() => {
    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const itemCount = lines.reduce((s, l) => s + l.quantity, 0);
    return { lines, subtotal, itemCount, currency: "usd", removed: [], adjusted: [] };
  }, [lines]);

  const add = useCallback(
    (productId: string, quantity = 1) => {
      setError(null);
      const p = byId.get(productId);
      if (!p) return Promise.resolve(cart);
      setLines((prev) => {
        const existing = prev.find((l) => l.productId === productId);
        if (existing) {
          return prev.map((l) =>
            l.productId === productId
              ? { ...l, quantity: l.quantity + quantity, lineTotal: (l.quantity + quantity) * l.unitPrice }
              : l,
          );
        }
        const unitPrice = p.price ?? 0;
        return [
          ...prev,
          { productId, title: p.title, image: p.image, unitPrice, quantity, lineTotal: unitPrice * quantity, available: 99 },
        ];
      });
      return Promise.resolve(cart);
    },
    [byId, cart],
  );

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setError(null);
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.productId !== productId)
        : prev.map((l) => (l.productId === productId ? { ...l, quantity, lineTotal: quantity * l.unitPrice } : l)),
    );
    return Promise.resolve(null);
  }, []);

  const remove = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
    return Promise.resolve(null);
  }, []);

  const checkout = useCallback(async () => {
    setError("Checkout isn't available in preview — launch your store to sell for real.");
  }, []);

  return { cart, busy: false, error, add, setQuantity, remove, checkout };
}
