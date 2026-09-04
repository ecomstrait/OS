import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@ecomstrait/auth/server";
import { getMySupplier } from "@/lib/supplier-context";
import { ProductForm, type ProductFormValues } from "@/components/catalog/product-form";

export const metadata: Metadata = { title: "Edit product" };

/**
 * Only ever a same-app catalog path — never trust `?from=` as an arbitrary
 * redirect target (it's attacker-controllable, it's a query param on a
 * public URL) even though it only ever gets used for an in-app Link/redirect.
 */
function safeReturnTo(raw: string | undefined): string {
  if (raw && raw.startsWith("/catalog") && !raw.startsWith("//")) return raw;
  return "/catalog";
}

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const returnTo = safeReturnTo(from);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const supplier = await getMySupplier();
  if (supplier?.status !== "approved") redirect("/catalog");

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!product) notFound();

  const initial: Partial<ProductFormValues> = {
    title: product.title,
    category: product.category ?? "",
    sku: product.sku ?? "",
    wholesale_price: product.wholesale_price != null ? String(product.wholesale_price) : "",
    retail_price: product.retail_price != null ? String(product.retail_price) : "",
    map_price: product.map_price != null ? String(product.map_price) : "",
    stock: String(product.stock ?? 0),
    status: product.status,
    description: product.description ?? "",
    seo_title: product.seo_title ?? "",
    seo_description: product.seo_description ?? "",
    images: product.images ?? [],
    sizes: product.sizes ?? "",
    material: product.material ?? "",
    fit_note: product.fit_note ?? "",
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Link href={returnTo} className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800">
        <ArrowLeft className="h-4 w-4" /> Catalog
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-ink-950">Edit product</h1>
      <div className="mt-6">
        <ProductForm userId={user.id} productId={product.id} initial={initial} returnTo={returnTo} />
      </div>
    </div>
  );
}
