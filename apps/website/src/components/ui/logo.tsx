import Link from "next/link";
import { cn } from "@/lib/utils";
import { BetaBadge } from "@/components/ui/beta-badge";

type LogoProps = {
  className?: string;
  invert?: boolean;
  showText?: boolean;
};

/** EcomStrait wordmark: cart-forming mark + two-tone type. */
export function Logo({ className, invert = false, showText = true }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="EcomStrait home"
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-ink-900 to-ink-950 shadow-lg shadow-ink-950/20">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
          <path
            d="M3 4h2.2l1 3m0 0 1.9 7.2a2 2 0 0 0 1.94 1.5h6.7a2 2 0 0 0 1.94-1.5L21 7H6.2Z"
            stroke="#10B981"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="10" cy="20" r="1.4" fill="#3B82F6" />
          <circle cx="17" cy="20" r="1.4" fill="#3B82F6" />
        </svg>
      </span>
      {showText && (
        <span className="inline-flex items-center gap-1.5 text-lg font-extrabold tracking-tight font-display">
          <span>
            <span className={invert ? "text-white" : "text-ink-950"}>Ecom</span>
            <span className="text-brand-500">Strait</span>
          </span>
          <BetaBadge />
        </span>
      )}
    </Link>
  );
}
