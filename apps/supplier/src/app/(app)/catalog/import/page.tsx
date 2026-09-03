import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@ecomstrait/auth/server";
import { getMySupplier } from "@/lib/supplier-context";
import { getEntitlements } from "@/lib/entitlements";
import { CsvImport } from "@/components/catalog/csv-import";

export const metadata: Metadata = { title: "Import products" };

export default async function ImportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const supplier = await getMySupplier();
  if (supplier?.status !== "approved") redirect("/catalog");

  const entitlements = await getEntitlements();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/catalog" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800">
        <ArrowLeft className="h-4 w-4" /> Catalog
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-ink-950">Import products</h1>
      <p className="mt-1 text-sm text-ink-500">
        Upload a CSV, map the columns, and bulk-create products as drafts.
      </p>
      <div className="mt-6">
        <CsvImport canAddProduct={entitlements.canAddProduct} />
      </div>
    </div>
  );
}
