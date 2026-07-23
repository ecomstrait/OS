import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";
import { Placeholder } from "@/components/app/placeholder";

export const metadata: Metadata = { title: "Sales" };

export default function Page() {
  return (
    <Placeholder
      icon={TrendingUp}
      title="Sales"
      body="Revenue and performance across your stores."
    />
  );
}
