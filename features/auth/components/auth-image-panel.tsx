import { cn } from "@/lib/utils";

/**
 * Panel oscuro con el símbolo grande de fondo (mismo tratamiento recortado al
 * 10% de opacidad que la sección "principios" de la landing) y la marca.
 * Compartido por `AuthModal` (dentro de la tarjeta flotante) y
 * `AuthBrandPanel` (pantalla completa) para que ambos caminos de
 * ingresar/registro se vean idénticos.
 */
export function AuthImagePanel({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-full overflow-hidden bg-ink", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/vardelab-simbolo-blanco.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute -right-16 top-1/2 h-[135%] w-auto -translate-y-1/2 opacity-[0.1]"
      />
      <div className="relative z-10 flex h-full flex-col justify-end p-10 text-white">
        <p className="text-lg font-semibold leading-snug">
          Desafíos reales. Talento que se demuestra.
        </p>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/60">
          Vardelab conecta estudiantes con organizaciones para resolver
          microproyectos claros, con objetivos y acompañamiento.
        </p>
      </div>
      <div
        className="pointer-events-none absolute -bottom-24 -left-16 size-80 rounded-full bg-electric/12 blur-3xl"
        aria-hidden
      />
    </div>
  );
}
