import { Skeleton } from "@/components/ui/skeleton";

/**
 * Estado de carga de "Detalle de reporte" (M-04): contexto + panel de acción.
 * Next lo envuelve en Suspense.
 */
export default function DetalleReporteLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 lg:py-10" role="status">
      <span className="sr-only">Cargando el reporte…</span>

      <Skeleton className="h-4 w-24" />
      <div className="mt-3">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-1.5 h-4 w-64" />
      </div>

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="rounded-2xl border border-border bg-white p-7">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="mt-4 h-6 w-1/2" />
          <Skeleton className="mt-2 h-4 w-40" />
          <Skeleton className="mt-2 h-4 w-56" />
          <Skeleton className="mt-6 h-20 w-full rounded-xl" />
          <Skeleton className="mt-4 h-16 w-full" />
        </div>

        <div className="rounded-2xl border border-border bg-white p-6">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="mt-4 h-10 w-full rounded-lg" />
          <Skeleton className="mt-2 h-24 w-full rounded-lg" />
          <Skeleton className="mt-2 h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
