import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";
import { getProjectsForAdminPage } from "@/features/admin/queries";
import { ProjectsTable } from "@/features/admin/components/projects-table";

export const metadata: Metadata = {
  title: "Proyectos · Vardelab",
};

type PageProps = {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
};

/**
 * Lista de todos los proyectos del piloto (D-01, hallazgo de la revisión de
 * métricas): antes el admin solo veía agregados (KPIs, conteos por estado),
 * nunca la lista real. La RLS ya le daba acceso completo
 * (`projects_select_published_or_manager` incluye `has_role(admin)` desde
 * M3) — faltaba la pantalla. Desde acá se entra al detalle de un proyecto
 * (`/admin/proyectos/[id]`), que es donde vive la opción de cancelarlo.
 *
 * Paginación real (M79): antes traía TODOS los proyectos y los filtraba en
 * el cliente — con volumen real (prueba de carga) la tabla se volvía una
 * lista interminable.
 */
export default async function AdminProyectosPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");
  if (!user.esAdmin) redirect("/");

  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const filters = { q: sp.q, status: sp.status };

  const { proyectos, total, pageSize } = await getProjectsForAdminPage(page, filters);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col px-6 py-6 lg:h-dvh lg:py-8">
      <header className="shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Proyectos</h1>
        <p className="mt-1.5 text-muted">
          Todos los proyectos del piloto, en cualquier estado.
        </p>
      </header>

      {/* En desktop la página ocupa el alto completo (lg:h-dvh arriba) y esto
          se estira para llenarlo: la tabla scrollea internamente si hace
          falta, pero la paginación queda siempre pegada abajo, no importa
          cuántas filas entren. En mobile no hay altura fija — scroll normal
          de la página, como cualquier otra pantalla del panel. */}
      <div className="mt-6 flex min-h-0 flex-1 flex-col lg:overflow-hidden">
        <ProjectsTable
          proyectos={proyectos}
          total={total}
          page={page}
          totalPages={totalPages}
          filters={filters}
        />
      </div>
    </div>
  );
}
