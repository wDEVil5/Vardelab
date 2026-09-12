import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { getCurrentUser } from "@/features/auth/queries";
import { getMyReports, getReportTarget } from "@/features/reports/queries";
import { ReportDetailButton } from "@/features/reports/components/report-detail-button";

export const metadata: Metadata = {
  title: "Mis reportes · CampusLab",
};

const ESTADO: Record<string, { label: string; tone: BadgeTone }> = {
  abierto: { label: "Abierto", tone: "brand" },
  en_revision: { label: "En revisión", tone: "outline" },
  resuelto: { label: "Resuelto", tone: "success" },
};

/**
 * "Mis reportes" (S-08): problemas que el usuario reportó (desde el botón
 * "Reportar" de un proyecto o un perfil) y su estado. Reportar en sí ya existe
 * (`ReportButton`); esto era lo que faltaba — no había forma de ver qué pasó
 * después de reportar algo.
 */
export default async function MisReportesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar?next=/mis-reportes");

  const reportes = await getMyReports();
  const targets = await Promise.all(
    reportes.map((r) => getReportTarget(r.target_type, r.target_id)),
  );

  const abiertos = reportes.filter((r) => r.status === "abierto").length;
  const enRevision = reportes.filter((r) => r.status === "en_revision").length;
  const resueltos = reportes.filter((r) => r.status === "resuelto").length;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink">Mis reportes</h1>
        <p className="text-sm text-muted">Problemas que has reportado y su estado.</p>
      </header>

      {reportes.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
          <p className="font-medium text-ink">Todavía no reportaste nada</p>
          <p className="mt-1 text-sm text-muted">
            Cuando reportes un proyecto o un perfil, aparece acá con su estado.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-10 flex flex-wrap gap-5">
            <KpiStat valor={abiertos} label="Abiertos" />
            <KpiStat valor={enRevision} label="En revisión" />
            <KpiStat valor={resueltos} label="Resueltos" />
          </div>

          <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-white">
            <table className="w-full min-w-160 text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <th className="px-8 py-5 font-medium">Reporte</th>
                  <th className="px-8 py-5 font-medium">Estado</th>
                  <th className="px-8 py-5 font-medium">Destino</th>
                  <th className="px-8 py-5 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {reportes.map((r, i) => {
                  const estado = ESTADO[r.status] ?? {
                    label: r.status,
                    tone: "neutral" as BadgeTone,
                  };
                  const target = targets[i];
                  return (
                    <tr key={r.id} className="border-b border-border/60 last:border-0">
                      <td className="px-8 py-6 font-medium text-ink">{r.motivo}</td>
                      <td className="px-8 py-6">
                        <Badge tone={estado.tone}>{estado.label}</Badge>
                      </td>
                      <td className="px-8 py-6 text-muted">
                        {target?.label ?? "Ya no disponible"}
                      </td>
                      <td className="px-8 py-6">
                        <ReportDetailButton report={r} target={target} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function KpiStat({ valor, label }: { valor: number; label: string }) {
  return (
    <div className="w-36 shrink-0 rounded-2xl border border-border bg-white p-6">
      <p className="text-2xl font-semibold tracking-tight text-ink">{valor}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}
