import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";
import {
  getReportCountsByStatus,
  getReportsPage,
  getReportTarget,
} from "@/features/reports/queries";
import { ReportsTable, type ReportRow } from "@/features/reports/components/reports-table";

export const metadata: Metadata = {
  title: "Reportes · Vardelab",
};

type PageProps = {
  searchParams: Promise<{ estado?: string; page?: string }>;
};

const FILTROS_VALIDOS = ["abiertos", "en_revision", "resueltos", "todos"] as const;

/**
 * Cola de reportes (Fase 2 · confianza). KPIs reales (sin "Alta prioridad": no
 * hay un campo de prioridad en el modelo). Cada fila lleva a la pantalla de
 * detalle (M-04). La RLS `reports_select_own_or_moderator` (M7) limita el
 * acceso a moderador/admin para ver todos.
 *
 * Paginación real: antes traía TODOS los reportes históricos y, peor, resolvía
 * el destino (`getReportTarget`) de CADA UNO con una consulta extra — un N+1
 * sin límite. Paginar acota ambas cosas de una vez: solo se resuelve el
 * destino de los reportes de la página actual.
 */
export default async function ReportesPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");
  if (!user.esModerador && !user.esAdmin) redirect("/");

  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const filtro = FILTROS_VALIDOS.includes(sp.estado as (typeof FILTROS_VALIDOS)[number])
    ? (sp.estado as (typeof FILTROS_VALIDOS)[number])
    : "abiertos";

  const [{ reports, total, pageSize }, conteos] = await Promise.all([
    getReportsPage(page, filtro),
    getReportCountsByStatus(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Se resuelve el destino de cada reporte en el servidor: un componente
  // cliente no puede consultar la tabla del proyecto/perfil correspondiente.
  // Acotado a la página actual (máx. `REPORTS_PAGE_SIZE`), no a todo el
  // historial.
  const reportsWithTarget: ReportRow[] = await Promise.all(
    reports.map(async (r) => ({
      ...r,
      target: await getReportTarget(r.target_type, r.target_id),
    })),
  );

  return (
    // Mismo patrón que /moderacion, /admin/proyectos, /admin/organizaciones:
    // encabezado/KPIs/filtros fijos, solo la lista de abajo scrollea.
    <div className="mx-auto flex w-full max-w-4xl flex-col px-6 py-8 lg:h-dvh lg:py-10">
      <header className="shrink-0 flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink">Reportes</h1>
        <p className="text-sm text-muted">
          Proyectos y perfiles reportados por la comunidad.
        </p>
      </header>

      {/* KPIs */}
      <div className="mt-6 shrink-0 grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-3xl font-bold text-electric">{conteos.abiertos}</p>
          <p className="mt-1 text-sm text-muted">Abiertos</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-3xl font-bold text-ink">{conteos.en_revision}</p>
          <p className="mt-1 text-sm text-muted">En revisión</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-3xl font-bold text-ink">{conteos.resueltos}</p>
          <p className="mt-1 text-sm text-muted">Resueltos</p>
        </div>
      </div>

      <div className="mt-6 flex min-h-0 flex-1 flex-col lg:overflow-hidden">
        <ReportsTable
          reports={reportsWithTarget}
          total={total}
          page={page}
          totalPages={totalPages}
          filtro={filtro}
          conteos={conteos}
        />
      </div>
    </div>
  );
}
