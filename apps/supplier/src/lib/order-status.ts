import type { ComponentType } from "react";
import { Truck, PackageCheck, X, type LucideProps } from "lucide-react";
import type { OrderStatus } from "@ecomstrait/db/types";

export const ORDER_STATUS_STYLE: Record<OrderStatus, string> = {
  processing: "bg-ai-50 text-ai-700",
  shipped: "bg-amber-50 text-amber-700",
  delivered: "bg-brand-50 text-brand-700",
  cancelled: "bg-red-50 text-red-600",
};

/** Solid-dot equivalent of `ORDER_STATUS_STYLE`, for compact inline indicators. */
export const ORDER_STATUS_DOT: Record<OrderStatus, string> = {
  processing: "bg-ai-500",
  shipped: "bg-amber-500",
  delivered: "bg-brand-500",
  cancelled: "bg-red-500",
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Sort order for the orders list — active first. */
export const ORDER_STATUS_ORDER: Record<OrderStatus, number> = {
  processing: 0,
  shipped: 1,
  delivered: 2,
  cancelled: 3,
};

export type StatusTransition = {
  to: OrderStatus;
  label: string;
  icon: ComponentType<LucideProps>;
  tone: "brand" | "red";
};

/**
 * The fulfilment lifecycle: which statuses an order can move to from its
 * current one. Single source of truth for every place that can change a
 * status — the detail page's action buttons (`OrderStatusActions`), the
 * list page's per-row quick select (`OrderQuickStatus`), and its bulk action
 * bar (`OrdersList`) — so the three never quietly drift apart on what a
 * "valid" move is.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, StatusTransition[]> = {
  processing: [
    { to: "shipped", label: "Mark shipped", icon: Truck, tone: "brand" },
    { to: "cancelled", label: "Cancel order", icon: X, tone: "red" },
  ],
  shipped: [{ to: "delivered", label: "Mark delivered", icon: PackageCheck, tone: "brand" }],
  delivered: [],
  cancelled: [],
};
