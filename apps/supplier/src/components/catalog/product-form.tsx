"use client";

import { useState } from "react";
import { Loader2, Sparkles, Upload, X } from "lucide-react";
import { createClient } from "@ecomstrait/auth/client";
import { cn } from "@ecomstrait/ui";
import type { ProductStatus } from "@ecomstrait/db/types";
import { Button, TextField } from "@/components/ui";
import { createProduct, updateProduct, enrichProductAction } from "@/lib/product-actions";

export type ProductFormValues = {
  title: string;
  category: string;
  sku: string;
  wholesale_price: string;
  retail_price: string;
  stock: string;
  status: ProductStatus;
  description: string;
  seo_title: string;
  seo_description: string;
  images: string[];
};

const EMPTY: ProductFormValues = {
  title: "",
  category: "",
  sku: "",
  wholesale_price: "",
  retail_price: "",
  stock: "0",
  status: "draft",
  description: "",
  seo_title: "",
  seo_description: "",
  images: [],
};

const BUCKET = "product-images";

export function ProductForm({
  userId,
  productId,
  initial,
}: {
  userId: string;
  productId?: string;
  initial?: Partial<ProductFormValues>;
}) {
  const [form, setForm] = useState<ProductFormValues>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const publicUrl = (path: string) =>
    supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

  function set<K extends keyof ProductFormValues>(k: K, v: ProductFormValues[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function enrich() {
    if (!form.title.trim()) {
      setError("Add a product title first.");
      return;
    }
    setEnriching(true);
    setError(null);
    try {
      const r = await enrichProductAction({
        title: form.title,
        category: form.category || undefined,
        wholesalePrice: form.wholesale_price ? Number(form.wholesale_price) : undefined,
      });
      if ("error" in r) {
        setError(r.error);
        return;
      }
      // Explicit action → regenerate and replace the AI-authored fields.
      // Only the suggested price defers to a value the user already typed.
      setForm((f) => ({
        ...f,
        description: r.description,
        seo_title: r.seoTitle,
        seo_description: r.seoDescription,
        retail_price: r.suggestedRetailPrice ? String(r.suggestedRetailPrice) : f.retail_price,
      }));
    } finally {
      setEnriching(false);
    }
  }

  async function onFiles(files: FileList) {
    setUploading(true);
    setError(null);
    try {
      const paths: string[] = [];
      for (const file of Array.from(files)) {
        const safe = file.name.replace(/[^a-z0-9.]+/gi, "-").toLowerCase();
        const path = `${userId}/${file.lastModified}-${safe}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { upsert: true });
        if (upErr) throw upErr;
        paths.push(path);
      }
      setForm((f) => ({ ...f, images: [...f.images, ...paths] }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("A title is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = { ...form };
    const res = productId
      ? await updateProduct(productId, payload)
      : await createProduct(payload);
    // Success redirects; only errors return.
    if (res && "error" in res) {
      setError(res.error);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
      {/* Main */}
      <div className="flex flex-col gap-5 lg:col-span-2">
        <Card>
          <TextField
            id="title"
            label="Product title"
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
          />
          <div className="mt-4 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="description" className="text-sm font-medium text-ink-700">
                Description
              </label>
              <button
                type="button"
                onClick={enrich}
                disabled={enriching}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-ai-600 hover:text-ai-700 disabled:opacity-50"
              >
                {enriching ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Enrich with EcomAI
              </button>
            </div>
            <textarea
              id="description"
              rows={5}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="rounded-xl border border-ink-200 bg-white p-3 text-sm text-ink-950 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </Card>

        <Card title="Images">
          <div className="flex flex-wrap gap-3">
            {form.images.map((path) => (
              <div key={path} className="relative h-20 w-20 overflow-hidden rounded-lg border border-ink-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={publicUrl(path)} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() => set("images", form.images.filter((p) => p !== path))}
                  className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-ink-950/70 text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label className="grid h-20 w-20 cursor-pointer place-items-center rounded-lg border border-dashed border-ink-300 text-ink-400 hover:border-ink-400">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && onFiles(e.target.files)}
              />
            </label>
          </div>
        </Card>

        <Card title="SEO">
          <TextField
            id="seo_title"
            label="SEO title"
            value={form.seo_title}
            onChange={(e) => set("seo_title", e.target.value)}
          />
          <div className="mt-4 flex flex-col gap-1.5">
            <label htmlFor="seo_description" className="text-sm font-medium text-ink-700">
              SEO description
            </label>
            <textarea
              id="seo_description"
              rows={2}
              value={form.seo_description}
              onChange={(e) => set("seo_description", e.target.value)}
              className="rounded-xl border border-ink-200 bg-white p-3 text-sm text-ink-950 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="flex flex-col gap-5">
        <Card title="Status">
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value as ProductStatus)}
            className="h-11 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </Card>

        <Card title="Pricing & stock">
          <div className="grid gap-4">
            <TextField id="wholesale_price" label="Wholesale price" type="number" value={form.wholesale_price} onChange={(e) => set("wholesale_price", e.target.value)} />
            <TextField id="retail_price" label="Retail price" type="number" value={form.retail_price} onChange={(e) => set("retail_price", e.target.value)} />
            <TextField id="stock" label="Stock" type="number" value={form.stock} onChange={(e) => set("stock", e.target.value)} />
          </div>
        </Card>

        <Card title="Organization">
          <div className="grid gap-4">
            <TextField id="category" label="Category" value={form.category} onChange={(e) => set("category", e.target.value)} />
            <TextField id="sku" label="SKU" value={form.sku} onChange={(e) => set("sku", e.target.value)} />
          </div>
        </Card>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={saving || uploading}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : productId ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-ink-100 bg-white p-5")}>
      {title && <h2 className="mb-4 text-sm font-semibold text-ink-950">{title}</h2>}
      {children}
    </div>
  );
}
