import { Skeleton } from "@/components/ui/skeleton";

/**
 * Estado de carga de "Moderación": encabezado, KPIs y la tabla filtrable.
 * Next lo envuelve en Suspense.
 */
export default function ModeracionLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 lg:py-10" role="status">
      <span className="sr-only">Cargando la cola de moderación…</span>

      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-2 h-4 w-64" />

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-white p-5">
            <Skeleton className="h-8 w-10" />
            <Skeleton className="mt-2 h-4 w-20" />
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-white">
        <div className="flex gap-3 border-b border-border p-5">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="hidden h-10 w-44 rounded-lg sm:block" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-border px-5 py-4 last:border-0"
          >
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="hidden h-4 w-32 md:block" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
