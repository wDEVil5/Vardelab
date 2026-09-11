import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";
import { getPilotMetrics } from "@/features/admin/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Métricas del piloto · CampusLab",
};

/**
 * Panel de métricas del piloto (D-01, RF-14). Solo admin — moderador tiene su
 * propio resumen en `/inicio`. Adaptado a datos reales: sin "satisfacción" ni
 * "patrocinadores que repetirían" (no existe encuesta en el modelo); en su
 * lugar, los indicadores computables del PRD §3.5 (matching, calidad,
 * portafolio, seguridad).
 */
export default async function AdminMetricasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");
  if (!user.esAdmin) redirect("/");

  const m = await getPilotMetrics();

  const pctAceptadas = porcentaje(m.postulaciones.aceptadas, m.postulaciones.total);
  const pctHitosAprobados = porcentaje(m.hitos.aprobados, m.hitos.total);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8 lg:py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Métricas del piloto
        </h1>
        <p className="mt-1 text-muted">
          Evidencia agregada de participación, calidad e impacto.
        </p>
      </header>

      {/* KPIs principales */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi value={m.publicados} label="Publicados" />
        <Kpi value={m.completados} label="Completados" tone="success" />
        <Kpi value={m.equiposFormados} label="Equipos formados" />
        <Kpi value={m.evidenciasPortafolio} label="Evidencias de portafolio" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Proyectos por estado */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-semibold text-ink">Proyectos por estado</h2>
          {m.porEstado.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Todavía no hay proyectos.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {m.porEstado.map((e) => (
                <li key={e.estado} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-sm text-muted">{e.etiqueta}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
                    <span
                      className="block h-full rounded-full bg-electric"
                      style={{
                        width: `${porcentaje(e.total, m.totalProyectos)}%`,
                      }}
                    />
                  </span>
                  <span className="w-6 shrink-0 text-right text-sm font-medium text-ink">
                    {e.total}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* North Star Metric */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-semibold text-ink">North Star Metric</h2>
          <p className="mt-3 text-4xl font-bold text-sprout">{m.northStar.completados}</p>
          <p className="mt-1 text-sm text-muted">
            microproyectos completados con entregable validado y evidencia.
          </p>
          <span
            className={cn(
              "mt-4 inline-block rounded-full px-3 py-1 text-xs font-medium",
              m.northStar.enObjetivo
                ? "bg-sprout/15 text-sprout"
                : "bg-surface text-muted",
            )}
          >
            {m.northStar.enObjetivo
              ? "En objetivo"
              : `Meta orientativa: ${m.northStar.meta}+ (PRD §15)`}
          </span>
        </div>
      </div>

      {/* Indicadores secundarios (PRD §3.5) */}
      <div className="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-border bg-white p-6 sm:grid-cols-3">
        <Indicador
          label="Postulaciones aceptadas"
          valor={m.postulaciones.total > 0 ? `${pctAceptadas}%` : "—"}
          nota={`${m.postulaciones.aceptadas} de ${m.postulaciones.total}`}
        />
        <Indicador
          label="Hitos aprobados"
          valor={m.hitos.total > 0 ? `${pctHitosAprobados}%` : "—"}
          nota={`${m.hitos.aprobados} de ${m.hitos.total}`}
        />
        <Indicador
          label="Reportes"
          valor={`${m.reportes.abiertos} abiertos`}
          nota={`${m.reportes.resueltos} resueltos`}
        />
      </div>
    </div>
  );
}

function porcentaje(parte: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((parte / total) * 100);
}

function Kpi({
  value,
  label,
  tone = "ink",
}: {
  value: number;
  label: string;
  tone?: "ink" | "success";
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <p
        className={cn(
          "text-3xl font-bold",
          tone === "success" ? "text-sprout" : "text-ink",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}

function Indicador({
  label,
  valor,
  nota,
}: {
  label: string;
  valor: string;
  nota: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-ink">{valor}</p>
      <p className="text-xs text-muted">{nota}</p>
    </div>
  );
}
