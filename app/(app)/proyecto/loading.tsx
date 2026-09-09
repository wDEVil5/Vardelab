import { Skeleton } from "@/components/ui/skeleton";

/**
 * Estado de carga del índice de proyectos: encabezado y una grilla de tarjetas.
 * (Con un solo proyecto la página redirige al espacio, que tiene su propio
 * esqueleto.) Next lo envuelve en Suspense.
 */
export default function ProyectosIndexLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 lg:py-10" role="status">
      <span className="sr-only">Cargando tus proyectos…</span>

      {/* Encabezado */}
      <Skeleton className="h-7 w-44" />
      <Skeleton className="mt-2 h-4 w-72" />

      {/* Tarjetas */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-white p-6">
            <div className="flex items-center gap-3">
              <Skeleton className="size-11 rounded-xl" />
              <div className="flex-1">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="mt-1.5 h-3 w-1/3" />
              </div>
            </div>
            <Skeleton className="mt-5 h-2 w-full rounded-full" />
            <Skeleton className="mt-4 h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
