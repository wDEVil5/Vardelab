"use client";

import { motion, useReducedMotion } from "motion/react";

/** Confirmación persistente: se muestra únicamente tras una respuesta exitosa. */
export function ActionSuccess({ title, description }: { title: string; description: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      initial={{ opacity: 0, y: reduce ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.22 }}
      className="flex items-start gap-3 rounded-xl bg-sprout/10 p-4"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sprout/20 text-emerald-800">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <motion.path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: reduce ? 0 : 0.3, delay: reduce ? 0 : 0.1 }} />
        </svg>
      </span>
      <div className="min-w-0 wrap-break-word">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
    </motion.div>
  );
}
