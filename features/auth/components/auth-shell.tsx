import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AuthCarousel } from "@/features/auth/components/auth-carousel";

/**
 * Marco de las pantallas de autenticación (A-01/A-02): pantalla completa, sin el
 * header global. Panel de marca oscuro a toda la altura (solo desktop) con la
 * marca —que enlaza al inicio—, el tagline, un carrusel de información y el pie;
 * el formulario en una tarjeta a la derecha. El borde interno va redondeado.
 */
export function AuthShell({
  slides,
  children,
}: {
  slides: ReactNode[];
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-surface">
      {/* Panel de marca (solo desktop), a toda la altura, con el borde interno redondeado. */}
      <aside className="hidden w-90 shrink-0 flex-col justify-between rounded-r-3xl bg-ink p-10 text-white lg:flex">
        <div className="flex flex-col gap-6">
          <Link href="/" className="text-2xl font-bold">
            CampusLab
          </Link>
          <p className="text-3xl font-bold leading-snug">
            Tu espacio para conectar talento y desafíos reales.
          </p>
        </div>

        <AuthCarousel slides={slides} />

        <p className="text-sm text-white/60">Piloto independiente</p>
      </aside>

      {/* Formulario. */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
        <Link href="/" className="text-lg font-bold text-ink">
          CampusLab
        </Link>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

/** Bloque de una diapositiva del carrusel: eyebrow + título + contenido. */
export function AuthSlide({
  eyebrow,
  titulo,
  children,
}: {
  eyebrow: string;
  titulo: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-electric">
          {eyebrow}
        </span>
        <span className="text-lg font-semibold text-white">{titulo}</span>
      </div>
      {children}
    </div>
  );
}

/**
 * Paso numerado dentro de una diapositiva. El paso final se resalta en electric
 * (es el resultado); los previos van apagados.
 */
export function AuthShellStep({
  n,
  titulo,
  texto,
  active = false,
}: {
  n: number;
  titulo: string;
  texto: string;
  active?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
          active ? "bg-electric" : "bg-white/10",
        )}
      >
        {n}
      </span>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-white">{titulo}</span>
        <span className="text-sm text-white/60">{texto}</span>
      </div>
    </div>
  );
}
