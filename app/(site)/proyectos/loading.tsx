import { Skeleton } from "@/components/ui/skeleton";

/**
 * Estado de carga del catálogo (P-02). Reserva encabezado, buscador, chips y una
 * grilla de tarjetas mientras se resuelven los proyectos publicados. Se renderiza
 * tras el header del layout `(site)`; Next lo envuelve en Suspense.
 */
export default function ProyectosLoading() {
  return (
    <main
      className="min-h-[calc(100dvh-3.5rem)] bg-surface"
      role="status"
      aria-label="Cargando proyectos"
    >
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        {/* Encabezado */}
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-2 h-4 w-72" />

        {/* Buscador */}
        <Skeleton className="mt-8 h-11 w-full rounded-lg" />

        {/* Chips */}
        <div className="mt-4 flex gap-2 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-24 shrink-0 rounded-full" />
          ))}
        </div>

        {/* Conteo */}
        <Skeleton className="mt-8 h-6 w-48" />

        {/* Grilla de tarjetas */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-lg border border-border bg-white p-5"
            >
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-1.5">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="mt-2 h-9 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
