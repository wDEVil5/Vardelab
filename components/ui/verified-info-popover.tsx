"use client";

import { useEffect, useRef, useState } from "react";
import { VerifiedBadge } from "@/components/ui/verified-badge";

/**
 * Explicación del sello según el tipo de organización (M62): mismo patrón
 * que usan Instagram/X/LinkedIn en su panel "Acerca de esta cuenta
 * verificada" — el sello no dice lo mismo para todas las cuentas, así que
 * tampoco debería decir lo mismo para todas las organizaciones de CampusLab.
 */
const TIPO_EXPLICACION: Record<string, string> = {
  academica:
    "CampusLab confirmó que esta es una unidad académica real dentro de su institución, y que quien la gestiona tiene autoridad para publicar proyectos en su nombre.",
  social:
    "CampusLab confirmó la identidad de esta organización social y que quien la gestiona representa oficialmente su trabajo en la comunidad.",
  emprendimiento:
    "CampusLab confirmó la identidad de este emprendimiento y de la persona o equipo que está detrás.",
  empresa:
    "CampusLab confirmó la identidad legal de esta empresa y que quien la gestiona está autorizado a publicar en su nombre.",
  interna:
    "CampusLab confirmó que esta es una unidad interna oficial de la institución.",
};

const TIPO_EXPLICACION_DEFAULT =
  "CampusLab confirmó la identidad de esta organización.";

/**
 * Sello verificado + panel de "qué significa esto" al hacer clic, al estilo
 * del ícono azul de Instagram/X que abre una tarjeta explicativa en vez de
 * solo un tooltip. A diferencia de `VerifiedBadge` (que se usa en todas
 * partes: tarjetas, listas, admin), esta versión solo va donde tiene sentido
 * un panel — la ficha pública y el detalle de organización — para no volver
 * ruidosa una grilla completa de tarjetas con popovers.
 */
export function VerifiedInfoBadge({
  tipo,
  className,
}: {
  tipo: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <span ref={wrapperRef} className="relative inline-flex shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Qué significa el sello de verificación"
        className="inline-flex shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric"
      >
        <VerifiedBadge className={className} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Acerca del sello de verificación"
          className="absolute left-1/2 top-full z-20 mt-2 w-72 -translate-x-1/2 rounded-xl border border-border bg-white p-4 text-left shadow-lg"
        >
          <div className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <VerifiedBadge className="pointer-events-none" />
            Organización verificada
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {TIPO_EXPLICACION[tipo] ?? TIPO_EXPLICACION_DEFAULT}
          </p>
        </div>
      )}
    </span>
  );
}
