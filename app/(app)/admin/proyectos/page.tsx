import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";
import { getProjectsForAdmin } from "@/features/admin/queries";
import { ProjectsTable } from "@/features/admin/components/projects-table";

export const metadata: Metadata = {
  title: "Proyectos · CampusLab",
};

/**
 * Lista de todos los proyectos del piloto (D-01, hallazgo de la revisión de
 * métricas): antes el admin solo veía agregados (KPIs, conteos por estado),
 * nunca la lista real. La RLS ya le daba acceso completo
 * (`projects_select_published_or_manager` incluye `has_role(admin)` desde
 * M3) — faltaba la pantalla. Desde acá se entra al detalle de un proyecto
 * (`/admin/proyectos/[id]`), que es donde vive la opción de cancelarlo.
 */
export default async function AdminProyectosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");
  if (!user.esAdmin) redirect("/");

  const proyectos = await getProjectsForAdmin();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-12">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Proyectos</h1>
        <p className="mt-1.5 text-muted">
          Todos los proyectos del piloto, en cualquier estado.
        </p>
      </header>

      <div className="mt-9">
        <ProjectsTable proyectos={proyectos} />
      </div>
    </div>
  );
}
