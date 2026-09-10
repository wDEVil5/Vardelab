import { Skeleton } from "@/components/ui/skeleton";

/**
 * Estado de carga de "Reportes": encabezado, KPIs y la cola filtrable.
 * Next lo envuelve en Suspense.
 */
export default function ReportesLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 lg:py-10" role="status">
      <span className="sr-only">Cargando reportes…</span>

      <Skeleton className="h-8 w-32" />
      <Skeleton className="mt-2 h-4 w-64" />

      <div className="mt-6 grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-white p-5">
            <Skeleton className="h-8 w-10" />
            <Skeleton className="mt-2 h-4 w-20" />
          </div>
        ))}
      </div>

      <Skeleton className="mt-6 h-10 w-72 rounded-full" />

      <div className="mt-4 flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5"
          >
            <div className="flex-1">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-1.5 h-3 w-1/3" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
