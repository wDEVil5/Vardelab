import { Skeleton } from "@/components/ui/skeleton";

/**
 * Estado de carga de "Mi perfil". Reproduce la distribución —identidad, franja de
 * visibilidad y dos columnas (datos a la izquierda; habilidades y portafolio a la
 * derecha)— para que el salto al contenido no mueva el layout. Next lo envuelve
 * en Suspense.
 */
export default function PerfilLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8 lg:py-10" role="status">
      <span className="sr-only">Cargando tu perfil…</span>

      {/* Encabezado */}
      <Skeleton className="h-7 w-40" />
      <Skeleton className="mt-2 h-4 w-80" />

      {/* Tarjeta de identidad */}
      <div className="mt-6 rounded-2xl border border-border bg-white p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-4 w-52" />
            <Skeleton className="mt-2 h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      </div>

      {/* Franja de visibilidad */}
      <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface/60 p-5">
        <div className="flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-2 h-3 w-3/4" />
        </div>
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>

      {/* Dos bloques: datos (izq.) · habilidades y portafolio (der.) */}
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        {/* Bloque izquierdo: datos en solo lectura */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <Skeleton className="h-5 w-28" />
          <div className="mt-4 flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-1.5 h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>

        {/* Bloque derecho: habilidades y portafolio */}
        <div className="flex flex-col gap-4">
          {["h-20", "h-28"].map((h, i) => (
            <div key={i} className="rounded-2xl border border-border bg-white p-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-2 h-4 w-3/4" />
              <Skeleton className={`mt-4 w-full rounded-lg ${h}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
