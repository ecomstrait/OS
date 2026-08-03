import type { Metadata } from "next";
import { GalleryClient } from "@/app/(app)/gallery/gallery-client";

export const metadata: Metadata = { title: "Store Gallery" };

export default function GalleryPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold text-ink-950">Store Gallery</h1>
      <p className="mt-1 text-sm text-ink-500">
        Pick a look — preview it on either selling path, then let EcomAI build with it.
      </p>
      <GalleryClient />
    </div>
  );
}
