import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";
import { getAllReports, getReportTarget } from "@/features/reports/queries";
import { ReportsTable, type ReportRow } from "@/features/reports/components/reports-table";

export const metadata: Metadata = {
  title: "Reportes · CampusLab",
};

/**
 * Cola de reportes (Fase 2 · confianza). KPIs reales (sin "Alta prioridad": no
 * hay un campo de prioridad en el modelo). Cada fila lleva a la pantalla de
 * detalle (M-04). La RLS `reports_select_own_or_moderator` (M7) limita el
 * acceso a moderador/admin para ver todos.
 */
export default async function ReportesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");
  if (!user.esModerador && !user.esAdmin) redirect("/");

  const reports = await getAllReports();

  // Se resuelve el destino de cada reporte en el servidor: un componente
  // cliente no puede consultar la tabla del proyecto/perfil correspondiente.
  const reportsWithTarget: ReportRow[] = await Promise.all(
    reports.map(async (r) => ({
      ...r,
      target: await getReportTarget(r.target_type, r.target_id),
    })),
  );

  const abiertos = reports.filter((r) => r.status === "abierto").length;
  const enRevision = reports.filter((r) => r.status === "en_revision").length;
  const resueltos = reports.filter((r) => r.status === "resuelto").length;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 lg:py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink">Reportes</h1>
        <p className="text-sm text-muted">
          Proyectos y perfiles reportados por la comunidad.
        </p>
      </header>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-3xl font-bold text-electric">{abiertos}</p>
          <p className="mt-1 text-sm text-muted">Abiertos</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-3xl font-bold text-ink">{enRevision}</p>
          <p className="mt-1 text-sm text-muted">En revisión</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-3xl font-bold text-ink">{resueltos}</p>
          <p className="mt-1 text-sm text-muted">Resueltos</p>
        </div>
      </div>

      <div className="mt-6">
        <ReportsTable reports={reportsWithTarget} />
      </div>
    </div>
  );
}
