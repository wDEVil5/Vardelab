import { Skeleton } from "@/components/ui/skeleton";

/**
 * Estado de carga de E-00 (inicio del estudiante). Reproduce el esqueleto del
 * panel real —fila de KPI y los dos paneles (medidor de progreso y próximas
 * entregas)— para que el salto al contenido no mueva el layout. Next lo envuelve
 * en Suspense.
 */
export default function InicioLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8 lg:py-10" role="status">
      <span className="sr-only">Cargando tu inicio…</span>

      {/* Encabezado */}
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-7 w-36 rounded-full" />
      </div>

      {/* Fila de KPI */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-white p-5">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="mt-3 h-8 w-16" />
            <Skeleton className="mt-2 h-4 w-20" />
            <Skeleton className="mt-1.5 h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Paneles: medidor + próximas entregas */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Medidor de progreso */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-2 h-5 w-2/3" />
          <div className="mt-6 flex flex-col items-center">
            <Skeleton className="h-28 w-64 rounded-t-full" />
            <Skeleton className="mt-4 h-4 w-40" />
          </div>
        </div>

        {/* Próximas entregas */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <Skeleton className="h-3 w-36" />
          <div className="mt-4 flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-2 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-5 h-4 w-28" />
        </div>
      </div>
    </div>
  );
}
