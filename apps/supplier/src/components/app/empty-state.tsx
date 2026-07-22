import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  body,
  cta,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ink-100 text-ink-400">
        <Icon className="h-7 w-7" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-ink-950">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-ink-500">{body}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          {cta.label} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
