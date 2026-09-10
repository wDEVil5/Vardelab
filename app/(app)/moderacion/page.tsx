import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";
import { getProjectsForReview } from "@/features/projects/queries";
import { ModerationQueueTable } from "@/features/projects/components/moderation-queue-table";

export const metadata: Metadata = {
  title: "Moderación · CampusLab",
};

/**
 * Cola de moderación (Fase 2), como panel: KPIs reales arriba y la tabla
 * filtrable de proyectos pendientes debajo. Sin "Riesgo" ni "Resueltos hoy"
 * (no existen en el modelo — no se inventan). Cada fila lleva a la pantalla de
 * revisión dedicada (M-02). La RLS de M18 refuerza el acceso a moderador/admin.
 */
export default async function ModeracionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");
  if (!user.esModerador && !user.esAdmin) redirect("/");

  const pendientes = await getProjectsForReview();

  const organizaciones = new Set(
    pendientes.map((p) => p.organization?.id).filter(Boolean),
  ).size;
  const rolesAbiertos = pendientes.reduce(
    (total, p) => total + p.roles.reduce((sub, r) => sub + r.cupos, 0),
    0,
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 lg:py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink">Cola de revisión</h1>
        <p className="text-sm text-muted">Revisa proyectos antes de publicarlos.</p>
      </header>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-3xl font-bold text-electric">{pendientes.length}</p>
          <p className="mt-1 text-sm text-muted">Pendientes</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-3xl font-bold text-ink">{organizaciones}</p>
          <p className="mt-1 text-sm text-muted">Organizaciones</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-3xl font-bold text-ink">{rolesAbiertos}</p>
          <p className="mt-1 text-sm text-muted">Cupos esperando</p>
        </div>
      </div>

      <div className="mt-6">
        <ModerationQueueTable proyectos={pendientes} />
      </div>
    </div>
  );
}
