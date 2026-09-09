import { Skeleton } from "@/components/ui/skeleton";

/**
 * Estado de carga de "Mis postulaciones". Reproduce los filtros y la tabla del
 * embudo mientras se resuelven las postulaciones, para que el salto al contenido
 * no mueva el layout. Next lo envuelve en Suspense.
 */
export default function MisPostulacionesLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 lg:py-10" role="status">
      <span className="sr-only">Cargando tus postulaciones…</span>

      {/* Encabezado */}
      <Skeleton className="h-7 w-52" />
      <Skeleton className="mt-2 h-4 w-64" />

      {/* Filtros (control segmentado) */}
      <Skeleton className="mt-8 h-10 w-80 rounded-full" />

      {/* Tabla */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-white">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-border px-5 py-4 last:border-0"
          >
            <div className="flex flex-1 items-center gap-3">
              <Skeleton className="size-10 rounded-xl" />
              <div className="flex-1">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="mt-1.5 h-3 w-1/3" />
              </div>
            </div>
            <Skeleton className="hidden h-4 w-32 md:block" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="hidden h-4 w-20 md:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
