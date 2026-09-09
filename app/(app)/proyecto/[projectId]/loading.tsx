import { Skeleton } from "@/components/ui/skeleton";

/**
 * Estado de carga de E-05 (espacio del proyecto). Reserva el encabezado, la
 * tarjeta de progreso y la lista de hitos para que el salto al contenido no mueva
 * el layout. Next lo envuelve en Suspense.
 */
export default function ProyectoLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8 lg:py-10" role="status">
      <span className="sr-only">Cargando tu proyecto…</span>

      {/* Encabezado */}
      <Skeleton className="h-7 w-40" />
      <Skeleton className="mt-2 h-4 w-64" />

      {/* Progreso */}
      <div className="mt-6 rounded-2xl border border-border bg-white p-6">
        <Skeleton className="h-4 w-32" />
        <div className="mt-3 flex items-center gap-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-2.5 flex-1 rounded-full" />
        </div>
        <Skeleton className="mt-4 h-4 w-48" />
      </div>

      {/* Hitos */}
      <div className="mt-4 rounded-2xl border border-border bg-white p-6">
        <Skeleton className="h-5 w-20" />
        <div className="mt-4 flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
