import { Skeleton } from "@/components/ui/skeleton";

/**
 * Estado de carga de la ficha de proyecto (P-03). Reserva encabezado, contenido
 * principal (con roles) y la tarjeta lateral mientras se resuelve la ficha. Se
 * renderiza tras el header del layout `(site)`; Next lo envuelve en Suspense.
 */
export default function ProyectoLoading() {
  return (
    <main className="flex-1 bg-surface" role="status" aria-label="Cargando el proyecto">
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        {/* Volver */}
        <Skeleton className="h-4 w-36" />

        {/* Encabezado */}
        <div className="mt-6">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-2 h-9 w-3/4" />
          <Skeleton className="mt-2 h-5 w-48" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Contenido principal */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="flex flex-col gap-6 rounded-2xl border border-border bg-white p-6 sm:p-8">
              <Skeleton className="h-5 w-full" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="mt-2 h-4 w-full" />
                  <Skeleton className="mt-1.5 h-4 w-5/6" />
                </div>
              ))}
            </div>

            {/* Roles */}
            <div>
              <Skeleton className="h-6 w-48" />
              <div className="mt-4 flex flex-col gap-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-border bg-white p-5">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="mt-2 h-4 w-2/3" />
                    <Skeleton className="mt-4 h-9 w-32 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tarjeta lateral */}
          <aside className="lg:col-span-1">
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="mt-2 h-10 w-full rounded-lg" />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
