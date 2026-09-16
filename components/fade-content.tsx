"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Adaptación del Fade Content de React Bits
 * (https://reactbits.dev/animations/fade-content): el bloque entra con
 * opacidad + blur leve al aparecer en viewport. Sin GSAP — usa motion —
 * y respeta prefers-reduced-motion.
 */
export function FadeContent({
  children,
  className,
  blur = true,
  duration = 0.45,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  blur?: boolean;
  /** Segundos. */
  duration?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (reduceMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={cn(className)}
      initial={{
        opacity: 0,
        filter: blur ? "blur(4px)" : "blur(0px)",
        y: 6,
      }}
      animate={
        visible
          ? { opacity: 1, filter: "blur(0px)", y: 0 }
          : { opacity: 0, filter: blur ? "blur(4px)" : "blur(0px)", y: 6 }
      }
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
