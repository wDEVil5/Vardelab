import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/features/auth/queries";
import { getMyProjects, type MyProject } from "@/features/projects/queries";

export const metadata: Metadata = {
  title: "Mis proyectos · CampusLab",
};

// Estado del proyecto → etiqueta y tono.
const ESTADO: Record<string, { label: string; tone: BadgeTone }> = {
  borrador: { label: "Borrador", tone: "neutral" },
  en_revision: { label: "En revisión", tone: "brand" },
  publicado: { label: "Publicado", tone: "success" },
  seleccion: { label: "En selección", tone: "brand" },
  activo: { label: "Activo", tone: "success" },
  revision_final: { label: "Revisión final", tone: "brand" },
  completado: { label: "Completado", tone: "success" },
  suspendido: { label: "Suspendido", tone: "danger" },
  cancelado: { label: "Cancelado", tone: "danger" },
};

// Estados que ya no están "en juego" (fuera del conteo de Activos).
const TERMINADOS = new Set(["completado", "suspendido", "cancelado"]);

/** Panel del patrocinador: sus proyectos. Requiere sesión de patrocinador. */
export default async function MisProyectosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar?next=/mis-proyectos");
  if (!user.esPatrocinador) redirect("/proyectos");

  const proyectos = await getMyProjects();

  const enRevision = proyectos.filter((p) => p.status === "en_revision").length;
  const completados = proyectos.filter((p) => p.status === "completado").length;
  const activos = proyectos.filter(
    (p) => p.status !== "en_revision" && !TERMINADOS.has(p.status),
  ).length;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 lg:py-10">
      <header className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-ink">Mis proyectos</h1>
          <p className="text-sm text-muted">
            Gestiona el ciclo completo de cada desafío.
          </p>
        </div>
        <Link
          href="/mis-proyectos/nuevo"
          className={buttonClasses({ variant: "primary", size: "sm" })}
        >
          Nuevo proyecto
        </Link>
      </header>

      {proyectos.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
          <p className="font-medium text-ink">Todavía no tienes proyectos</p>
          <p className="mt-1 text-sm text-muted">
            Crea tu primer proyecto: se guarda como borrador hasta que lo
            publiques.
          </p>
          <Link
            href="/mis-proyectos/nuevo"
            className={cn(
              "mt-4 inline-flex",
              buttonClasses({ variant: "primary", size: "sm" }),
            )}
          >
            Crear proyecto
          </Link>
        </div>
      ) : (
        <>
          {/* Tarjetas KPI: panorama del ciclo completo de un vistazo, antes
              de entrar al detalle de cada proyecto en la tabla. */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <KpiStat valor={activos} label="Activos" />
            <KpiStat valor={enRevision} label="En revisión" />
            <KpiStat valor={completados} label="Completados" />
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
            <table className="w-full min-w-140 text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <th className="px-6 py-4 font-medium">Proyecto</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 font-medium">Equipo</th>
                  <th className="px-6 py-4 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {proyectos.map((p) => (
                  <FilaProyecto key={p.id} proyecto={p} />
                ))}
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
    <div className="rounded-2xl border border-border bg-white p-5">
      <p className="text-2xl font-semibold tracking-tight text-ink">{valor}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

function FilaProyecto({ proyecto: p }: { proyecto: MyProject }) {
  const estado = ESTADO[p.status] ?? { label: p.status, tone: "neutral" as BadgeTone };

  // "Equipo" resume dónde está el proyecto en el ciclo aceptar → formar
  // equipo: si ya hay integrantes, cuántos; si no, cuántas postulaciones
  // esperan revisión; si no hay ninguna de las dos, aún no hay nada que ver.
  const equipoTexto =
    p.equipoTamano > 0
      ? `${p.equipoTamano} ${p.equipoTamano === 1 ? "estudiante" : "estudiantes"}`
      : p.postulacionesPendientes > 0
        ? `${p.postulacionesPendientes} ${p.postulacionesPendientes === 1 ? "postulación" : "postulaciones"}`
        : "Sin equipo";

  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="px-6 py-5">
        <Link
          href={`/mis-proyectos/${p.id}`}
          className="font-medium text-ink hover:text-electric"
        >
          {p.titulo}
        </Link>
        <p className="mt-0.5 text-xs text-muted">{p.organization?.nombre}</p>
      </td>
      <td className="px-6 py-5">
        <Badge tone={estado.tone}>{estado.label}</Badge>
      </td>
      <td className="px-6 py-5 text-muted">{equipoTexto}</td>
      <td className="px-6 py-5">
        <Link
          href={`/mis-proyectos/${p.id}`}
          className={buttonClasses({ variant: "outline", size: "sm" })}
        >
          Abrir
        </Link>
      </td>
    </tr>
  );
}
