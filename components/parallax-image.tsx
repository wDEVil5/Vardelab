"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";

/**
 * Envuelve el bloque (marco + imagen) y lo desliza de derecha a izquierda
 * atado al scroll: termina en su posición final cuando la sección llega al
 * centro del viewport.
 */
export function ParallaxBlock({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start center"],
  });
  const x = useTransform(scrollYProgress, [0, 1], [160, 0]);

  return (
    <motion.div ref={ref} className={className} style={reduceMotion ? undefined : { x }}>
      {children}
    </motion.div>
  );
}
