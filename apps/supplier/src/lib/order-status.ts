import type { OrderStatus } from "@ecomstrait/db/types";

export const ORDER_STATUS_STYLE: Record<OrderStatus, string> = {
  processing: "bg-ai-50 text-ai-700",
  shipped: "bg-amber-50 text-amber-700",
  delivered: "bg-brand-50 text-brand-700",
  cancelled: "bg-red-50 text-red-600",
};

/** Sort order for the orders list — active first. */
export const ORDER_STATUS_ORDER: Record<OrderStatus, number> = {
  processing: 0,
  shipped: 1,
  delivered: 2,
  cancelled: 3,
};
