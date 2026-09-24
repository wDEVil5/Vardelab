import type { Metadata } from "next";
import {
  getModerationModalidadCounts,
  getModerationQueueStats,
  getProjectsForReviewPage,
} from "@/features/projects/queries";
import { ModerationQueueTable } from "@/features/projects/components/moderation-queue-table";

export const metadata: Metadata = {
  title: "Moderación · Vardelab",
};

type PageProps = {
  searchParams: Promise<{ q?: string; modalidad?: string; page?: string }>;
};

/**
 * Cola de moderación (Fase 2), como panel: KPIs reales arriba y la tabla
 * filtrable de proyectos pendientes debajo. Sin "Riesgo" ni "Resueltos hoy"
 * (no existen en el modelo — no se inventan). Cada fila lleva a la pantalla de
 * revisión dedicada (M-02). La RLS de M18 refuerza el acceso a moderador/admin.
 *
 * Paginación real (M81): antes traía TODOS los proyectos en revisión y
 * filtraba/buscaba en memoria — sin techo garantizado si se acumula un pico
 * de publicaciones.
 */
export default async function ModeracionPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const filters = { q: sp.q, modalidad: sp.modalidad };

  const [{ proyectos, total, pageSize }, stats, conteosModalidad] = await Promise.all([
    getProjectsForReviewPage(page, filters),
    getModerationQueueStats(),
    getModerationModalidadCounts(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    // Mismo patrón que /admin/proyectos y /admin/organizaciones: en desktop
    // la página ocupa el alto completo del viewport y solo la lista de abajo
    // scrollea en su propia caja — encabezado, KPIs y filtros quedan fijos.
    <div className="mx-auto flex w-full max-w-4xl flex-col px-6 py-8 lg:h-dvh lg:py-10">
      <header className="shrink-0 flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink">Cola de revisión</h1>
        <p className="text-sm text-muted">Revisa proyectos antes de publicarlos.</p>
      </header>

      {/* KPIs — siempre 3 columnas en una fila (apiladas en mobile usaba
          demasiado alto): tarjetas y letra más chicas por debajo de `sm:`
          para que "Organizaciones" entre sin cortarse. */}
      <div className="mt-6 shrink-0 grid grid-cols-3 gap-2 sm:gap-4">
        <div className="rounded-2xl border border-border bg-white p-3 sm:p-5">
          <p className="text-xl font-bold text-electric sm:text-3xl">{stats.pendientes}</p>
          <p className="mt-1 text-xs text-muted sm:text-sm">Pendientes</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-3 sm:p-5">
          <p className="text-xl font-bold text-ink sm:text-3xl">{stats.organizaciones}</p>
          <p className="mt-1 text-xs text-muted sm:text-sm">Organizaciones</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-3 sm:p-5">
          <p className="text-xl font-bold text-ink sm:text-3xl">{stats.cuposAbiertos}</p>
          <p className="mt-1 text-xs text-muted sm:text-sm">Cupos esperando</p>
        </div>
      </div>

      <div className="mt-6 flex min-h-0 flex-1 flex-col lg:overflow-hidden">
        <ModerationQueueTable
          proyectos={proyectos}
          total={total}
          page={page}
          totalPages={totalPages}
          filters={filters}
          conteos={conteosModalidad}
        />
      </div>
    </div>
  );
}
