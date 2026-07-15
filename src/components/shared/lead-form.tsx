"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "textarea" | "select";
  placeholder?: string;
  required?: boolean;
  options?: string[];
  full?: boolean;
};

/**
 * Configurable lead-capture form. Client-side validation + simulated submit.
 * Wire `onSubmit` to an API route / CRM in a later phase.
 */
export function LeadForm({
  fields,
  submitLabel = "Submit",
  successTitle = "Thank you!",
  successMessage = "We've received your details and will be in touch shortly.",
}: {
  fields: Field[];
  submitLabel?: string;
  successTitle?: string;
  successMessage?: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const nextErrors: Record<string, boolean> = {};
    for (const f of fields) {
      if (!f.required) continue;
      const value = String(data.get(f.name) ?? "").trim();
      if (!value) nextErrors[f.name] = true;
      if (f.type === "email" && value && !value.includes("@")) nextErrors[f.name] = true;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setStatus("loading");
    setTimeout(() => setStatus("done"), 900);
  }

  if (status === "done") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-brand-200 bg-brand-50 p-10 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-500 text-white">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h3 className="text-xl font-bold text-ink-950">{successTitle}</h3>
        <p className="max-w-sm text-sm text-ink-600">{successMessage}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid gap-4 rounded-3xl border border-ink-100 bg-white p-6 shadow-xl shadow-ink-950/5 sm:grid-cols-2 sm:p-8"
    >
      {fields.map((f) => (
        <div key={f.name} className={cn("flex flex-col gap-1.5", f.full && "sm:col-span-2")}>
          <label htmlFor={f.name} className="text-sm font-medium text-ink-700">
            {f.label}
            {f.required && <span className="text-brand-600"> *</span>}
          </label>
          {f.type === "textarea" ? (
            <textarea
              id={f.name}
              name={f.name}
              rows={4}
              placeholder={f.placeholder}
              className={inputClass(errors[f.name])}
            />
          ) : f.type === "select" ? (
            <select id={f.name} name={f.name} className={inputClass(errors[f.name])} defaultValue="">
              <option value="" disabled>
                {f.placeholder ?? "Select…"}
              </option>
              {f.options?.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          ) : (
            <input
              id={f.name}
              name={f.name}
              type={f.type ?? "text"}
              placeholder={f.placeholder}
              className={inputClass(errors[f.name])}
            />
          )}
          {errors[f.name] && (
            <span className="text-xs text-red-500">This field is required.</span>
          )}
        </div>
      ))}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-6 font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-600 disabled:opacity-60"
        >
          {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
        <p className="mt-3 text-center text-xs text-ink-400">
          By submitting, you agree to our{" "}
          <a href="/terms" className="underline">Terms</a> and{" "}
          <a href="/privacy" className="underline">Privacy Policy</a>.
        </p>
      </div>
    </form>
  );
}

function inputClass(hasError?: boolean) {
  return cn(
    "h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-ink-950 outline-none transition placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
    "[&:is(textarea)]:h-auto [&:is(textarea)]:py-3",
    hasError ? "border-red-400" : "border-ink-200",
  );
}
