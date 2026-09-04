import { Skeleton } from "@/components/ui/skeleton";

/**
 * Estado de carga de E-00 (inicio del estudiante). Reproduce el esqueleto del
 * panel real —KPIs, proyecto activo, columna de acciones y fila de widgets— para
 * que el salto al contenido no mueva el layout. Next lo envuelve en Suspense.
 */
export default function InicioLoading() {
  return (
    <div className="w-full px-6 py-8 lg:px-10 lg:py-10" role="status">
      <span className="sr-only">Cargando tu inicio…</span>

      {/* Encabezado */}
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-2 h-4 w-72" />

      {/* KPIs */}
      <div className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-white p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Proyecto activo + columna derecha */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white p-6 sm:p-8 lg:col-span-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-7 w-2/3" />
          <Skeleton className="mt-6 h-2 w-full" />
          <div className="mt-6 flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-white p-6">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-4 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-5/6" />
            </div>
          ))}
        </div>
      </div>

      {/* Widgets compactos */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-white p-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
