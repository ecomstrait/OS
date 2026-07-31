import { cn } from "@/lib/utils";

/**
 * "Beta" mark for the marketing site.
 *
 * Kept local rather than imported from @ecomstrait/ui: the website is a
 * standalone app with no workspace UI dependency, and pulling one in would mean
 * adding transpilePackages to its build. Mirror any wording change in
 * packages/ui/src/beta-badge.tsx.
 */
export function BetaBadge({ className }: { className?: string }) {
  return (
    <span
      title="Beta — the full version launches soon"
      className={cn(
        "inline-flex select-none items-center rounded-full bg-ai-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ai-700",
        className,
      )}
    >
      Beta
    </span>
  );
}
