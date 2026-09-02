"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { createSampleRequest, type SampleRequestInput } from "@/lib/admin-actions";

type ProductOption = { id: string; title: string };

const EMPTY: SampleRequestInput = {
  storeName: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  shipping: "",
  timeline: "",
  note: "",
  productId: null,
  productName: "",
  quantity: 25,
  message: "",
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-medium text-ink-600">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-medium text-ink-600">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
      />
    </label>
  );
}

/**
 * Replaces the old one-click "Create sample request" button, which inserted
 * the exact same hardcoded "Nova Boutique" row every time — easy to click by
 * mistake right after Approve (they sit stacked in the same sidebar), which
 * is why it looked like approval itself was creating requests. Requiring an
 * admin to actually fill in contact + shipping details makes it a deliberate
 * action instead of a single misclick.
 */
export function SampleRequestForm({
  supplierId,
  products,
}: {
  supplierId: string;
  products: ProductOption[];
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SampleRequestInput>(EMPTY);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  function set<K extends keyof SampleRequestInput>(k: K, v: SampleRequestInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function pickProduct(id: string) {
    set("productId", id || null);
    const p = products.find((p) => p.id === id);
    if (p) set("productName", p.title);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(null);
    start(async () => {
      const res = await createSampleRequest(supplierId, form);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setDone("Request created.");
      setForm(EMPTY);
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            setDone(null);
            setOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
        >
          <Plus className="h-4 w-4" /> Create sample request
        </button>
        {done && <p className="text-xs text-brand-600">{done}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-ink-500">New sample request</p>
        <button type="button" onClick={() => setOpen(false)} className="text-ink-400 hover:text-ink-700">
          <X className="h-4 w-4" />
        </button>
      </div>

      <Field label="Store name" required value={form.storeName} onChange={(v) => set("storeName", v)} placeholder="Nova Boutique" />
      <Field label="Contact name" required value={form.contactName} onChange={(v) => set("contactName", v)} placeholder="Alex Rivera" />
      <Field
        label="Contact email"
        required
        type="email"
        value={form.contactEmail}
        onChange={(v) => set("contactEmail", v)}
        placeholder="alex@example.com"
      />
      <Field
        label="Contact phone"
        type="tel"
        value={form.contactPhone ?? ""}
        onChange={(v) => set("contactPhone", v)}
        placeholder="+1 555 010 1234"
      />
      <TextArea
        label="Shipping address"
        value={form.shipping ?? ""}
        onChange={(v) => set("shipping", v)}
        placeholder="123 Market St, Austin, TX 78701, US"
      />
      <Field label="Timeline" value={form.timeline ?? ""} onChange={(v) => set("timeline", v)} placeholder="Within 2 weeks" />

      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-ink-600">Product</span>
        {products.length > 0 ? (
          <select
            value={form.productId ?? ""}
            onChange={(e) => pickProduct(e.target.value)}
            className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
          >
            <option value="">— pick one, or type a name below —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-ink-400">This supplier has no products yet — type a product name below.</p>
        )}
      </label>
      <Field
        label="Product name"
        required
        value={form.productName}
        onChange={(v) => set("productName", v)}
        placeholder="Sample product"
      />

      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-ink-600">Quantity</span>
        <input
          type="number"
          min={1}
          value={form.quantity}
          onChange={(e) => set("quantity", Number(e.target.value))}
          className="rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
        />
      </label>

      <TextArea
        label="Note (shown on the request)"
        value={form.note ?? ""}
        onChange={(v) => set("note", v)}
        placeholder="Trialling demand for a new collection — keen to place a starter order."
      />
      <TextArea
        label="Opening message (conversation thread)"
        value={form.message ?? ""}
        onChange={(v) => set("message", v)}
        placeholder="Hi! We'd love to stock this. What's your lead time for this quantity?"
      />

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create request"}
      </button>
    </form>
  );
}
