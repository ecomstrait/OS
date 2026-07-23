import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@ecomstrait/auth/server";
import { productImage } from "@/lib/catalog";
import type { StorePlan } from "@/lib/ecomai";
import { StoreEditor, type EditorProduct } from "@/components/stores/store-editor";

export const metadata: Metadata = { title: "Edit store" };

export default async function EditStorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, content, logo_url, live_url")
    .eq("id", id)
    .eq("user_id", user!.id)
    .maybeSingle();
  if (!store) notFound();

  const { data: sp } = await supabase
    .from("store_products")
    .select("product_id, price")
    .eq("store_id", id);
  const ids = (sp ?? []).map((r) => r.product_id);

  let products: EditorProduct[] = [];
  if (ids.length) {
    const { data: prods } = await supabase
      .from("products")
      .select("id, title, images, retail_price")
      .in("id", ids);
    const priceMap = new Map((sp ?? []).map((r) => [r.product_id, r.price]));
    products = (prods ?? []).map((p) => ({
      id: p.id,
      title: p.title,
      price: priceMap.get(p.id) ?? p.retail_price,
      image: productImage(p.images?.[0]),
    }));
  }

  return (
    <div className="mx-auto max-w-6xl">
      <StoreEditor
        storeId={store.id}
        storeName={store.name ?? "Your store"}
        liveUrl={store.live_url}
        logoUrl={store.logo_url}
        initialPlan={store.content as unknown as StorePlan}
        products={products}
      />
    </div>
  );
}
