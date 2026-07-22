import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@ecomstrait/auth/server";
import { getMySupplier } from "@/lib/supplier-context";
import { ProductForm } from "@/components/catalog/product-form";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const supplier = await getMySupplier();
  if (supplier?.status !== "approved") redirect("/catalog");

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/catalog" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800">
        <ArrowLeft className="h-4 w-4" /> Catalog
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-ink-950">New product</h1>
      <div className="mt-6">
        <ProductForm userId={user.id} />
      </div>
    </div>
  );
}
