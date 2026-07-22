import type { RequestStatus } from "@ecomstrait/db/types";

export const REQUEST_STATUS_STYLE: Record<RequestStatus, string> = {
  new: "bg-ai-50 text-ai-700",
  accepted: "bg-brand-50 text-brand-700",
  proposed: "bg-amber-50 text-amber-700",
  declined: "bg-red-50 text-red-600",
  fulfilled: "bg-ink-100 text-ink-500",
};

/** Sort order for the inbox — things needing attention first. */
export const REQUEST_STATUS_ORDER: Record<RequestStatus, number> = {
  new: 0,
  proposed: 1,
  accepted: 2,
  fulfilled: 3,
  declined: 4,
};
