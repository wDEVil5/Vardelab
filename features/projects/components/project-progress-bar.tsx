"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Barra de progreso general del proyecto (E-05), con el mismo efecto de
 * conteo + llenado que ya usa el medidor del inicio del estudiante
 * (`ProgressGauge`): el número y la barra animan desde 0 hasta el valor real
 * al montar, en vez de aparecer ya completos. Respeta `prefers-reduced-motion`.
 *
 * `children` (opcional) se agrega debajo, dentro de la misma tarjeta —
 * pensado para el equipo del proyecto: con un equipo chico, darle su propia
 * tarjeta se sentía como una caja vacía.
 */
export function ProjectProgressBar({
  pct,
  orgName,
  children,
}: {
  pct: number;
  orgName: string | null;
  children?: ReactNode;
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

  return (
    <div className="mt-6 rounded-2xl border border-border bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-4">
          {/* Ancho fijo (`tabular-nums` + `min-w`): sin esto, el texto cambia
              de tamaño según la cantidad de dígitos (0%, 12%, 100%) durante
              el conteo, y "Progreso general" se corre al lado a cada frame. */}
          <span className="w-[4.5ch] shrink-0 text-3xl font-bold tabular-nums tracking-tight text-electric">
            {Math.round(valor)}%
          </span>
          <div className="min-w-0 wrap-break-word">
            <p className="text-sm font-medium text-ink">Progreso general</p>
            {orgName && <p className="text-xs text-muted">{orgName}</p>}
          </div>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface sm:w-56">
          {/* Sin `transition`: el ancho ya se interpola cuadro a cuadro en el
              `requestAnimationFrame` de arriba — agregar además una transición
              CSS hace que la barra vaya un paso detrás del número. */}
          <div
            className="h-full rounded-full bg-electric"
            style={{ width: `${valor}%` }}
          />
        </div>
      </div>
      {children && <div className="mt-5 border-t border-border pt-5">{children}</div>}
    </div>
  );
}
