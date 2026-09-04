import { Skeleton } from "@/components/ui/skeleton";

/**
 * Estado de carga de "Mi perfil". Reserva la forma del encabezado, el formulario
 * y las secciones (habilidades, portafolio, visibilidad) mientras se resuelven
 * los datos. Next lo envuelve en Suspense.
 */
export default function PerfilLoading() {
  return (
    <div className="mx-auto w-full max-w-xl px-6 py-8 lg:py-10" role="status">
      <span className="sr-only">Cargando tu perfil…</span>

      {/* Encabezado */}
      <Skeleton className="h-7 w-40" />
      <Skeleton className="mt-2 h-4 w-full" />

      {/* Formulario */}
      <div className="mt-8 flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-2 h-10 w-full" />
          </div>
        ))}
      </div>

      {/* Secciones (habilidades y portafolio) */}
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="mt-10">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="mt-2 h-4 w-3/4" />
          <Skeleton className="mt-4 h-24 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}
