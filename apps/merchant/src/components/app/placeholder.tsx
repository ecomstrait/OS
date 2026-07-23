import type { LucideIcon } from "lucide-react";

export function Placeholder({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-ink-950">{title}</h1>
      <div className="mt-6 grid place-items-center rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ink-100 text-ink-400">
          <Icon className="h-7 w-7" />
        </span>
        <p className="mt-4 max-w-sm text-sm text-ink-500">{body}</p>
        <span className="mt-3 rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-500">
          Coming in an upcoming beta phase
        </span>
      </div>
    </div>
  );
}
