import type { ReactNode } from "react";

/**
 * Marco de las pantallas de autenticación (A-01/A-02): pantalla completa, sin el
 * header global. Panel de marca oscuro y redondeado a la izquierda (solo
 * desktop) con la marca, el tagline, una sección contextual y el pie; el
 * formulario en una tarjeta a la derecha. Alineado al diseño de Figma.
 */
export function AuthShell({
  aside,
  children,
}: {
  aside: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen gap-6 bg-surface p-4 sm:p-6">
      {/* Panel de marca (solo desktop). */}
      <aside className="hidden w-90 shrink-0 flex-col justify-between rounded-3xl bg-ink p-10 text-white lg:flex">
        <div className="flex flex-col gap-6">
          <span className="text-2xl font-bold">CampusLab</span>
          <p className="text-2xl font-bold leading-snug">
            Tu espacio para conectar talento y desafíos reales.
          </p>
        </div>
        <div>{aside}</div>
        <p className="text-sm text-white/60">
          Piloto independiente · No oficial UNAB
        </p>
      </aside>

      {/* Formulario. */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8">
        <span className="text-lg font-bold text-ink">CampusLab</span>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

/** Paso numerado del panel de marca. */
export function AuthShellStep({
  n,
  titulo,
  texto,
}: {
  n: number;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-electric text-xs font-semibold text-white">
        {n}
      </span>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-white">{titulo}</span>
        <span className="text-sm text-white/60">{texto}</span>
      </div>
    </div>
  );
}
