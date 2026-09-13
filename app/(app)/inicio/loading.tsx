import { Skeleton } from "@/components/ui/skeleton";

/**
 * Estado de carga de /inicio. La misma ruta sirve tres paneles muy distintos
 * (estudiante, moderador, patrocinador) según el rol — y eso solo se sabe
 * adentro del Server Component, después de resolver la sesión, así que este
 * `loading.tsx` no puede saber cuál va a render. En vez de calcar el de un
 * solo rol (quedaba mal para los otros dos), reproduce la forma que los tres
 * comparten: encabezado, una fila de KPI y un par de tarjetas debajo.
 */
export default function InicioLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8 lg:py-10" role="status">
      <span className="sr-only">Cargando tu inicio…</span>

      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-32 rounded-full" />
      </div>

      {/* Fila de KPI */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-white p-5">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="mt-3 h-8 w-16" />
            <Skeleton className="mt-2 h-4 w-20" />
          </div>
        ))}
      </div>

      {/* Un par de tarjetas de contenido, dos veces: cubre razonablemente
          tanto los paneles cortos (un par de tarjetas) como el del
          patrocinador, que apila varias filas de estas. */}
      {Array.from({ length: 2 }).map((_, fila) => (
        <div key={fila} className="mt-4 grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-white p-6">
              <Skeleton className="h-4 w-32" />
              <div className="mt-4 flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <Skeleton className="size-9 shrink-0 rounded-lg" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
