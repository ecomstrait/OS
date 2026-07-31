import { cn } from "./cn";

/**
 * "Beta" mark shown next to the product name across every portal.
 *
 * Shared rather than re-implemented per app so the wording and styling can't
 * drift — when the full version ships, this is the one place to change.
 */
export function BetaBadge({
  className,
  title = "Beta — the full version launches soon",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex select-none items-center rounded-full bg-ai-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ai-700 align-middle",
        className,
      )}
    >
      Beta
    </span>
  );
}

/**
 * One-line strip for the top of an app, stating this is a beta.
 *
 * Deliberately not dismissible: during beta it should stay visible so a
 * merchant is never unsure which version they're using.
 */
export function BetaBanner({
  message = "You're using the EcomStrait beta. Things may change, and the full version launches soon.",
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "w-full bg-ai-600 px-4 py-1.5 text-center text-xs font-medium text-white",
        className,
      )}
    >
      {message}
    </div>
  );
}
