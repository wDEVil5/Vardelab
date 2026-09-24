"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/** Confirmación persistente: se muestra únicamente tras una respuesta exitosa. */
export function ActionSuccess({
  title,
  description,
  variant = "default",
}: {
  title: string;
  description: string;
  variant?: "default" | "quiet";
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      initial={{ opacity: 0, y: reduce ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.22 }}
      className={cn(
        "flex items-start gap-3",
        variant === "default"
          ? "rounded-xl bg-sprout/10 p-4"
          : "border-y border-border py-5",
      )}
    >
      <motion.span
        initial={{ opacity: 0, scale: reduce ? 1 : 0.72 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduce ? 0 : 0.28, ease: "easeOut" }}
        className={cn(
          "flex shrink-0 items-center justify-center text-sprout",
          variant === "default"
            ? "size-10 rounded-full bg-sprout/20 text-emerald-800"
            : "mt-0.5 size-8 rounded-full border border-sprout/40",
        )}
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <motion.path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: reduce ? 0 : 0.3, delay: reduce ? 0 : 0.1 }} />
        </svg>
      </motion.span>
      <div className="min-w-0 wrap-break-word">
        <p className={cn("font-semibold text-ink", variant === "default" ? "text-sm" : "text-base")}>
          {title}
        </p>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
    </motion.div>
  );
}
