"use client";

import { Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

/** The EcomAI mark — a glowing gradient orb. Reused across every AI surface. */
export function AiAvatar({
  size = 40,
  online = false,
}: {
  size?: number;
  online?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <span
      className="relative grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-ai-500 to-ai-700 text-white shadow-lg shadow-ai-500/30"
      style={{ width: size, height: size }}
    >
      {!reduce && (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-xl"
          animate={{ opacity: [0.35, 0.8, 0.35] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          style={{ boxShadow: "0 0 22px rgba(59,130,246,0.6)" }}
        />
      )}
      <Sparkles className="relative" style={{ width: size * 0.5, height: size * 0.5 }} />
      {online && (
        <span
          className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white bg-brand-500"
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
    </span>
  );
}
