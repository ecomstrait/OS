import { cn } from "@ecomstrait/ui";

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost";
}) {
  return (
    <button
      className={cn(
        "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition disabled:opacity-60",
        variant === "primary" && "bg-brand-500 text-white shadow-lg shadow-brand-500/25 hover:bg-brand-600",
        variant === "outline" && "border border-ink-200 bg-white text-ink-900 hover:bg-ink-50",
        variant === "ghost" && "text-ink-600 hover:bg-ink-100",
        className,
      )}
      {...props}
    />
  );
}

export function TextField({
  label,
  id,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; id: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink-700">
        {label}
      </label>
      <input
        id={id}
        className={cn(
          "h-11 rounded-xl border border-ink-200 bg-white px-4 text-sm text-ink-950 outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20",
          className,
        )}
        {...props}
      />
    </div>
  );
}
