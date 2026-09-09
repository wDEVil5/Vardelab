"use client";

import { useEffect, useState } from "react";

// Tokens de marca en hex (los trazos SVG no toman clases de Tailwind).
const ELECTRIC = "#3867FF";
const SPROUT = "#62D5A2";
const TRACK = "#E3E8EE";
const RADIO = 90;
const LARGO = Math.PI * RADIO; // longitud del arco semicircular

/**
 * Medidor semicircular de progreso (0–100 %) que se dibuja al montar: el arco se
 * llena de 0 al valor real y el número cuenta en paralelo (efecto "completado").
 * Respeta `prefers-reduced-motion`: si está activo, muestra el valor final sin
 * animar. SVG + un rAF acotado (~900 ms), sin librerías.
 */
export function ProgressGauge({ pct }: { pct: number }) {
  const objetivo = Math.max(0, Math.min(100, pct));
  const [valor, setValor] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      // Sin animación: se muestra el valor final directamente (no es un bucle).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValor(objetivo);
      return;
    }

    let raf = 0;
    const inicio = performance.now();
    const DUR = 900;
    const tick = (ahora: number) => {
      const t = Math.min(1, (ahora - inicio) / DUR);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setValor(objetivo * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [objetivo]);

  const avance = (valor / 100) * LARGO;
  const color = valor >= 99.5 ? SPROUT : ELECTRIC;

  return (
    <svg
      viewBox="0 0 200 120"
      className="w-full max-w-xs"
      role="img"
      aria-label={`Progreso del proyecto: ${Math.round(objetivo)}%`}
    >
      {/* Riel */}
      <path
        d="M 10 105 A 90 90 0 0 1 190 105"
        fill="none"
        stroke={TRACK}
        strokeWidth={14}
        strokeLinecap="round"
      />
      {/* Avance */}
      <path
        d="M 10 105 A 90 90 0 0 1 190 105"
        fill="none"
        stroke={color}
        strokeWidth={14}
        strokeLinecap="round"
        strokeDasharray={`${avance} ${LARGO}`}
      />
      <text
        x="100"
        y="96"
        textAnchor="middle"
        className="fill-ink text-3xl font-semibold"
      >
        {Math.round(valor)}%
      </text>
    </svg>
  );
}
