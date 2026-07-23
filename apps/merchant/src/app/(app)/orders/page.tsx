import type { Metadata } from "next";
import { ShoppingBag } from "lucide-react";
import { Placeholder } from "@/components/app/placeholder";

export const metadata: Metadata = { title: "Orders" };

export default function Page() {
  return (
    <Placeholder
      icon={ShoppingBag}
      title="Orders"
      body="Orders synced from your stores, routed to suppliers for fulfilment."
    />
  );
}
