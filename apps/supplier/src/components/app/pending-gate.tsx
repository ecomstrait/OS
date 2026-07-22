import { Lock } from "lucide-react";
import type { SupplierStatus } from "@ecomstrait/db/types";
import { EmptyState } from "@/components/app/empty-state";

/**
 * Blocks a feature until the supplier is approved. `status` may be null when the
 * supplier hasn't started onboarding at all.
 */
export function PendingGate({
  status,
  feature,
}: {
  status: SupplierStatus | null;
  feature: string;
}) {
  const copy: Record<string, { title: string; body: string; cta: { href: string; label: string } }> = {
    none: {
      title: "Complete onboarding first",
      body: `Set up your supplier profile to unlock ${feature}.`,
      cta: { href: "/onboarding", label: "Start onboarding" },
    },
    pending: {
      title: "Finish onboarding",
      body: `Complete and submit onboarding to unlock ${feature}.`,
      cta: { href: "/onboarding", label: "Continue onboarding" },
    },
    in_review: {
      title: "Pending approval",
      body: `Your application is under review. ${feature} unlocks once an admin verifies your business.`,
      cta: { href: "/dashboard", label: "Back to overview" },
    },
    rejected: {
      title: "Verification needed",
      body: `We couldn't verify your application, so ${feature} is locked. Please review your details or contact support.`,
      cta: { href: "/dashboard", label: "Back to overview" },
    },
  };

  const key = status ?? "none";
  const c = copy[key] ?? copy.in_review;

  return <EmptyState icon={Lock} title={c.title} body={c.body} cta={c.cta} />;
}
