"use client";

import type { ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Tarjeta con halo suave (inspirada en el lenguaje visual de React Bits /
 * glow borders, sin seguir el cursor). `featured` activa un glow electric
 * respirando; el resto es una card quieta. Respeta reduced-motion.
 */
export function GlowCard({
  children,
  featured = false,
  className,
}: {
  children: ReactNode;
  featured?: boolean;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border bg-white p-6 transition-colors duration-200",
        featured
          ? "border-electric/35 shadow-[0_10px_30px_-18px_rgba(56,103,255,0.45)]"
          : "border-border hover:border-electric/25",
        className,
      )}
    >
      {featured ? (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -top-10 -right-10 size-36 rounded-full bg-electric/20 blur-2xl",
            !reduceMotion && "animate-breathe",
          )}
        />
      ) : null}
      <div className="relative z-10 flex h-full flex-col gap-3">{children}</div>
    </div>
  );
}
