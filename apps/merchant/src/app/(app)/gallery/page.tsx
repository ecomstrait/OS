import { redirect } from "next/navigation";
// import type { Metadata } from "next";
// import { GalleryClient } from "@/app/(app)/gallery/gallery-client";

// export const metadata: Metadata = { title: "Store Gallery" };

/**
 * Hidden while we offer a single premium theme (Noir) — browsing a gallery
 * of one doesn't make sense. Sends anyone who still has this bookmarked (or
 * a `?theme=` link in the wild) straight to the builder, which defaults to
 * the one theme on offer. Restore the body below once there's more than one
 * theme to choose between again.
 */
export default function GalleryPage() {
  redirect("/builder");

  // return (
  //   <div className="mx-auto max-w-6xl">
  //     <h1 className="text-2xl font-bold text-ink-950">Store Gallery</h1>
  //     <p className="mt-1 text-sm text-ink-500">
  //       Pick a look — preview it on either selling path, then let EcomAI build with it.
  //     </p>
  //     <GalleryClient />
  //   </div>
  // );
}
