import { Skeleton } from "@/components/ui/skeleton";

/**
 * Estado de carga de "Mis postulaciones". Reserva el encabezado y una lista de
 * tarjetas mientras se resuelven las postulaciones y los equipos. Next lo
 * envuelve en Suspense.
 */
export default function MisPostulacionesLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8 lg:py-10" role="status">
      <span className="sr-only">Cargando tus postulaciones…</span>

      {/* Encabezado */}
      <Skeleton className="h-7 w-52" />
      <Skeleton className="mt-2 h-4 w-64" />

      {/* Lista de tarjetas */}
      <div className="mt-8 flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start justify-between gap-4 rounded-lg border border-border bg-white p-5"
          >
            <div className="flex-1">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="mt-2 h-4 w-1/2" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
