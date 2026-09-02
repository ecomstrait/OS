import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@ecomstrait/auth/server";
import { OnboardingWizard } from "@/components/onboarding/wizard";
import { EMPTY_FORM, type SupplierForm } from "@/lib/onboarding";

export const metadata: Metadata = { title: "Onboarding" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: supplier } = await supabase
    .from("suppliers")
    .select("*")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  // Already submitted → back to the dashboard status view.
  if (supplier && supplier.status !== "pending") redirect("/dashboard");

  const { data: docs } = supplier
    ? await supabase
        .from("supplier_documents")
        .select("type, storage_path")
        .eq("supplier_id", supplier.id)
    : { data: [] };

  const initialForm: SupplierForm = supplier
    ? {
        business_name: supplier.business_name ?? "",
        business_type: supplier.business_type ?? "",
        contact_person: supplier.contact_person ?? "",
        phone: supplier.phone ?? "",
        country: supplier.country ?? "",
        city: supplier.city ?? "",
        website: supplier.website ?? "",
        years_in_business: supplier.years_in_business ?? "",
        product_categories: supplier.product_categories ?? [],
        number_of_products: supplier.number_of_products ?? "",
        manufacturing_type: supplier.manufacturing_type ?? "",
        description: supplier.description ?? "",
        estimated_inventory_size: supplier.estimated_inventory_size ?? "",
        average_lead_time: supplier.average_lead_time ?? "",
        shipping_regions: supplier.shipping_regions ?? [],
        min_order_quantity: supplier.min_order_quantity ?? "",
      }
    : EMPTY_FORM;

  const uploaded: Record<string, string> = {};
  (docs ?? []).forEach((d) => {
    uploaded[d.type] = d.storage_path;
  });

  return (
    <OnboardingWizard
      userId={user.id}
      initialForm={initialForm}
      initialStep={supplier?.onboarding_step ?? 1}
      initialSupplierId={supplier?.id ?? null}
      initialUploaded={uploaded}
      returnReasons={supplier?.return_reasons ?? []}
      returnNote={supplier?.return_note ?? null}
    />
  );
}
