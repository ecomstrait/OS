"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { StoreCard } from "./store-card";
import { storeTemplates, galleryCategories } from "@/content/gallery";
import { cn } from "@/lib/utils";

export function StoreGallery({
  filterable = false,
  limit,
}: {
  filterable?: boolean;
  limit?: number;
}) {
  const [category, setCategory] = useState("All");

  const filtered = storeTemplates
    .filter((s) => category === "All" || s.category === category)
    .slice(0, limit);

  return (
    <div>
      {filterable && (
        <div className="no-scrollbar mb-10 flex flex-wrap justify-center gap-2 overflow-x-auto">
          {galleryCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition",
                category === cat
                  ? "border-ink-950 bg-ink-950 text-white"
                  : "border-ink-200 bg-white text-ink-600 hover:border-ink-300",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((store) => (
            <motion.div
              key={store.name}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <StoreCard store={store} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
