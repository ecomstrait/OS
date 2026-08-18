import type { StoreStatus } from "@ecomstrait/db";

/**
 * Which store statuses a member of the public may see.
 *
 * Drafts exist from the moment EcomAI produces a plan, long before the merchant
 * has decided anything is finished — so the storefront and its API both check
 * this rather than assuming a row implies a live store. Archived stores are
 * excluded for the same reason in reverse: the merchant has taken them down.
 *
 * Deliberately an allow-list. A status added later is hidden until someone
 * decides it should be public, which is the safe direction to fail in.
 */
const PUBLIC_STATUSES: StoreStatus[] = ["ready_for_review", "live"];

export function isPublicStatus(status: string | null | undefined): boolean {
  return PUBLIC_STATUSES.includes(status as StoreStatus);
}

/**
 * Days a draft survives without the merchant touching it.
 *
 * Short on purpose. A draft is an unfinished build, not a saved store, and the
 * clock resets on every edit — so this only ever bites work that was genuinely
 * walked away from.
 */
export const DRAFT_TTL_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

/** When a draft last touched at `updatedAt` will be swept. */
export function draftExpiresAt(updatedAt: string): Date {
  return new Date(new Date(updatedAt).getTime() + DRAFT_TTL_DAYS * DAY_MS);
}

/** Whole days left before a draft expires; 0 means it goes on the next sweep. */
export function draftDaysLeft(updatedAt: string): number {
  const left = draftExpiresAt(updatedAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(left / DAY_MS));
}

/** How long a merchant has left, phrased for a badge. */
export function draftExpiryLabel(updatedAt: string): string {
  const days = draftDaysLeft(updatedAt);
  if (days <= 0) return "expires today";
  return `expires in ${days} day${days === 1 ? "" : "s"}`;
}
