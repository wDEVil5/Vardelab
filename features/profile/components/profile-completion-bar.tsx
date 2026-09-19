"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

/**
 * Estado de completitud del perfil: badge "Público/Privado" + badge de
 * "X% completo" + la barra, los tres animando el mismo valor al montar (el
 * mismo efecto de conteo que `ProjectProgressBar`) en vez de aparecer ya
 * llenos. Respeta `prefers-reduced-motion`.
 */
export function ProfileCompletionStatus({
  pct,
  esPublico,
}: {
  pct: number;
  esPublico: boolean;
}) {
  const objetivo = Math.max(0, Math.min(100, pct));
  const [valor, setValor] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
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

  const redondeado = Math.round(valor);

  return (
    <>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge tone={esPublico ? "success" : "neutral"}>
          {esPublico ? "Perfil público" : "Perfil privado"}
        </Badge>
        <Badge tone={pct >= 100 ? "success" : "brand"}>
          {redondeado}% completo
        </Badge>
      </div>

      {/* Barra de progreso: el número solo ("67% completo") no da una
          sensación inmediata de cuánto falta; el trazo sí. Al 100% se queda
          (no desaparece) y cambia a verde: cierra el ciclo en vez de que el
          indicador se esfume justo cuando terminaste. */}
      <div
        role="progressbar"
        aria-valuenow={redondeado}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Perfil completo"
        className="mt-2 h-1.5 w-full max-w-56 overflow-hidden rounded-full bg-surface"
      >
        {/* Sin `transition`: el ancho ya se interpola cuadro a cuadro en
            el `requestAnimationFrame` de arriba. */}
        <div
          className={pct >= 100 ? "h-full rounded-full bg-sprout" : "h-full rounded-full bg-electric"}
          style={{ width: `${valor}%` }}
        />
      </div>
    </>
  );
}
