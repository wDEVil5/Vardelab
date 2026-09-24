"use client";

import { useEffect, useState } from "react";
import type { PilotMetrics } from "@/features/admin/queries";

/**
 * Barras de "Proyectos por estado" en Métricas del piloto: mismo efecto de
 * llenado que `ProjectProgressBar`/`ProfileCompletionStatus` (animan desde 0
 * al montar, en vez de aparecer ya completas), pero con un solo
 * `requestAnimationFrame` compartido para toda la lista — así todas las
 * barras llenan sincronizadas, en vez de cada una animando su propio 0→100
 * por separado. Respeta `prefers-reduced-motion`.
 */
export function EstadoProgressBars({
  porEstado,
  totalProyectos,
}: {
  porEstado: PilotMetrics["porEstado"];
  totalProyectos: number;
}) {
  const [progreso, setProgreso] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProgreso(1);
      return;
    }

    let raf = 0;
    const inicio = performance.now();
    const DUR = 900;
    const tick = (ahora: number) => {
      const t = Math.min(1, (ahora - inicio) / DUR);
      setProgreso(1 - Math.pow(1 - t, 3)); // easeOutCubic
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <ul className="mt-5 flex flex-col gap-4">
      {porEstado.map((e) => (
        <li key={e.estado} className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-sm text-muted">{e.etiqueta}</span>
          <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface">
            <span
              className="block h-full rounded-full bg-electric"
              style={{ width: `${porcentaje(e.total, totalProyectos) * progreso}%` }}
            />
          </span>
          <span className="w-6 shrink-0 text-right text-sm font-medium text-ink">
            {e.total}
          </span>
        </li>
      ))}
    </ul>
  );
}

function porcentaje(parte: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((parte / total) * 100);
}
