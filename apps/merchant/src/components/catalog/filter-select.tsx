"use client";

/**
 * A filter dropdown that submits its enclosing GET form on change. Without JS
 * it still works — the form's Search button submits every field together.
 */
export function FilterSelect({
  name,
  value,
  allLabel,
  options,
  ariaLabel,
}: {
  name: string;
  value: string;
  allLabel: string;
  options: { value: string; label: string }[];
  ariaLabel: string;
}) {
  return (
    <select
      name={name}
      defaultValue={value}
      aria-label={ariaLabel}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className="h-10 max-w-[12rem] truncate rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-800 outline-none focus:border-brand-400"
    >
      <option value="">{allLabel}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
