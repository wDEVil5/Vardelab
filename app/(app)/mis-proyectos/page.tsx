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
              de entrar al detalle de cada proyecto en la lista. */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <KpiStat valor={activos} label="Activos" icon={IconRayo} tone="electric" />
            <KpiStat valor={enRevision} label="En revisión" icon={IconReloj} tone="coral" />
            <KpiStat valor={completados} label="Completados" icon={IconCheck} tone="sprout" />
          </div>

          <ul className="mt-6 flex flex-col gap-3">
            {proyectos.map((p) => (
              <FilaProyecto key={p.id} proyecto={p} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

const TONE_CLASSES = {
  electric: "bg-electric/10 text-electric",
  coral: "bg-coral/15 text-coral",
  sprout: "bg-sprout/15 text-sprout",
} as const;

function KpiStat({
  valor,
  label,
  icon: Icon,
  tone,
}: {
  valor: number;
  label: string;
  icon: (props: { className?: string }) => React.JSX.Element;
  tone: keyof typeof TONE_CLASSES;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5">
      <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", TONE_CLASSES[tone])}>
        <Icon className="size-5" />
      </span>
      <div className="flex flex-col">
        <p className="text-2xl font-semibold tracking-tight text-ink">{valor}</p>
        <p className="text-sm text-muted">{label}</p>
      </div>
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
    <li className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white p-6 transition-all hover:border-electric/30 hover:shadow-sm">
      <div className="flex items-center gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface text-muted">
          <IconCarpeta className="size-5" />
        </span>
        <div className="flex flex-col gap-0.5">
          <Link
            href={`/mis-proyectos/${p.id}`}
            className="font-semibold text-ink transition-colors hover:text-electric"
          >
            {p.titulo}
          </Link>
          <span className="text-xs text-muted">{p.organization?.nombre}</span>
        </div>
      </div>
      <div className="flex items-center gap-5">
        <Badge tone={estado.tone}>{estado.label}</Badge>
        <span className="w-28 shrink-0 text-sm text-muted">{equipoTexto}</span>
        <Link
          href={`/mis-proyectos/${p.id}`}
          className={buttonClasses({ variant: "outline", size: "sm" })}
        >
          Abrir
        </Link>
      </div>
    </li>
  );
}

function IconRayo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
    </svg>
  );
}

function IconReloj({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </svg>
  );
}

function IconCarpeta({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}
