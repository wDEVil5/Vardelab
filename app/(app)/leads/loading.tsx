import { Skeleton } from "@/components/ui/skeleton";

/**
 * Estado de carga del panel de leads: filtros segmentados + tarjetas. Next lo
 * envuelve en Suspense.
 */
export default function LeadsLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8 lg:py-10" role="status">
      <span className="sr-only">Cargando leads…</span>

      <Skeleton className="h-7 w-24" />
      <Skeleton className="mt-2 h-4 w-72" />

      <Skeleton className="mt-8 h-10 w-80 rounded-full" />

      <div className="mt-5 flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-white p-5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="mt-2 h-4 w-48" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-1 h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
