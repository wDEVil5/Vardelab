import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { getCurrentUser } from "@/features/auth/queries";
import {
  getReportById,
  getReportTarget,
  getReporterName,
} from "@/features/reports/queries";
import { ReportReviewControls } from "@/features/reports/components/report-review-controls";

export const metadata: Metadata = {
  title: "Detalle de reporte · CampusLab",
};

type PageProps = { params: Promise<{ id: string }> };

const ESTADO: Record<string, { label: string; tone: BadgeTone }> = {
  abierto: { label: "Abierto", tone: "brand" },
  en_revision: { label: "En revisión", tone: "outline" },
  resuelto: { label: "Resuelto", tone: "success" },
};

const TARGET_LABEL: Record<string, string> = {
  proyecto: "Proyecto",
  perfil: "Perfil",
};

// Tiempo relativo, sin ambigüedad.
function haceCuanto(iso: string): string {
  const horas = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (horas < 1) return "hace unos minutos";
  if (horas < 24) return `hace ${horas} ${horas === 1 ? "hora" : "horas"}`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias} ${dias === 1 ? "día" : "días"}`;
}

/**
 * M-04 · Detalle de reporte. Investiga el contexto (enlaza al proyecto o
 * perfil reportado) y registra una decisión. La RLS
 * `reports_select_own_or_moderator` (M7) deja verlo a moderador/admin.
 */
export default async function DetalleReportePage({ params }: PageProps) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");
  if (!user.esModerador && !user.esAdmin) redirect("/");

  const report = await getReportById(id);
  if (!report) redirect("/moderacion/reportes");

  const [target, reporterName] = await Promise.all([
    getReportTarget(report.target_type, report.target_id),
    getReporterName(report.reporter_id),
  ]);

  const estado = ESTADO[report.status] ?? {
    label: report.status,
    tone: "neutral" as BadgeTone,
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 lg:py-10">
      <Link
        href="/moderacion/reportes"
        className="text-sm text-muted transition-colors hover:text-ink"
      >
        ← Reportes
      </Link>

      <header className="mt-3 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-ink">Detalle de reporte</h1>
        <p className="text-sm text-muted">
          Investiga el contexto y registra una decisión.
        </p>
      </header>

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-[1fr_20rem]">
        {/* Contexto del reporte */}
        <div className="rounded-2xl border border-border bg-white p-7">
          <Badge tone={estado.tone}>{estado.label}</Badge>

          <h2 className="mt-4 text-xl font-bold text-ink">
            {TARGET_LABEL[report.target_type] ?? report.target_type} reportado
          </h2>
          {target ? (
            <Link
              href={target.href}
              className="mt-1 inline-block text-sm font-medium text-electric hover:underline"
            >
              {target.label} →
            </Link>
          ) : (
            <p className="mt-1 text-sm text-muted">
              El contenido ya no existe o no es accesible.
            </p>
          )}
          <p className="mt-2 text-sm text-muted">
            Reportado por {reporterName ?? "un usuario"} · {haceCuanto(report.created_at)}
          </p>

          <div className="mt-6 rounded-xl bg-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Motivo
            </p>
            <p className="mt-1.5 text-sm text-ink">{report.motivo}</p>
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Descripción
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink">
              {report.descripcion || "Sin descripción adicional."}
            </p>
          </div>

          {report.status === "resuelto" && report.resolucion && (
            <div className="mt-6 rounded-xl border border-sprout/30 bg-sprout/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Resolución
              </p>
              <p className="mt-1.5 text-sm text-ink">{report.resolucion}</p>
            </div>
          )}
        </div>

        {/* Acción */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="text-lg font-semibold text-ink">Acción</h2>
          <p className="mt-1 text-sm text-muted">
            Selecciona una medida y deja registro.
          </p>
          <div className="mt-4">
            <ReportReviewControls reportId={report.id} status={report.status} />
          </div>
        </div>
      </div>
    </div>
  );
}
