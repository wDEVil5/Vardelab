import { Skeleton } from "@/components/ui/skeleton";

/**
 * Estado de carga del perfil público de una organización. Reserva la forma
 * real de la página (banda + logo superpuesto + texto centrado + grilla de
 * proyectos) en vez de un spinner genérico, mismo criterio que
 * `proyectos/[id]/loading.tsx`.
 */
export default function PerfilOrganizacionLoading() {
  return (
    <main
      className="mx-auto w-full max-w-4xl flex-1 px-6 py-10"
      role="status"
      aria-label="Cargando el perfil de la organización"
    >
      <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-border bg-white">
        <Skeleton className="h-20 rounded-none sm:h-24" />
        <div className="flex flex-col items-center px-6 pb-8 text-center sm:px-10">
          <div className="-mt-10 sm:-mt-12">
            <Skeleton className="size-16 rounded-2xl ring-4 ring-white" />
          </div>
          <Skeleton className="mt-4 h-7 w-48" />
          <Skeleton className="mt-2 h-4 w-24" />
          <Skeleton className="mt-4 h-4 w-64" />
          <div className="mt-6 flex w-full flex-col items-center gap-2 border-t border-border pt-6">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>

      <div className="mt-10">
        <Skeleton className="h-6 w-48" />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-white p-5">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="mt-3 h-5 w-3/4" />
              <Skeleton className="mt-3 h-4 w-1/2" />
              <div className="mt-3 flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
