import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/features/auth/queries";
import { getMyProjects, type MyProject } from "@/features/projects/queries";

export const metadata: Metadata = {
  title: "Mis proyectos · Vardelab",
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
    <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:py-10">
      {/* `flex-col sm:flex-row` + `self-start` en el botón: ver comentario
          en mis-organizaciones/page.tsx — apilado y a su tamaño natural,
          no forzado a `w-full` (se veía como un banner). */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-ink">Mis proyectos</h1>
          <p className="text-sm text-muted">
            Gestiona el ciclo completo de cada desafío.
          </p>
        </div>
        <Link
          href="/mis-proyectos/nuevo"
          className={cn(buttonClasses({ variant: "primary", size: "sm" }), "self-start")}
        >
          Nuevo proyecto
        </Link>
      </header>

      {proyectos.length === 0 ? (
        <div className="mt-8 max-w-4xl rounded-lg border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
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
        // Izquierda (mismo ancho que antes, `max-w-4xl`): KPI + lista.
        // Derecha: tarjeta fija con contexto sobre los estados — mismo
        // lenguaje visual que "Completa tu perfil" en /u/[id] (borde
        // punteado, fondo con tinte). Se oculta bajo `lg` para no competir
        // con la lista en pantallas angostas.
        <div className="mt-8 flex items-start gap-6">
          <div className="max-w-4xl flex-1">
            {/* Tarjetas KPI: panorama del ciclo completo de un vistazo, antes
                de entrar al detalle de cada proyecto en la lista. */}
            <div className="grid grid-cols-3 gap-3">
              <KpiStat valor={activos} label="Activos" icon={IconRayo} tone="electric" />
              <KpiStat valor={enRevision} label="En revisión" icon={IconReloj} tone="coral" />
              <KpiStat valor={completados} label="Completados" icon={IconCheck} tone="sprout" />
            </div>

            <ul className="mt-6 flex flex-col gap-3">
              {proyectos.map((p) => (
                <FilaProyecto key={p.id} proyecto={p} />
              ))}
            </ul>
          </div>

          <aside className="hidden w-72 shrink-0 lg:block">
            <EstadosInfo />
          </aside>
        </div>
      )}
    </div>
  );
}

const ESTADOS_INFO: { estado: string; texto: string }[] = [
  { estado: "Borrador", texto: "Solo tú lo ves. Complétalo y envíalo a revisión cuando esté listo." },
  { estado: "En revisión", texto: "Un moderador lo está evaluando antes de que quede visible para estudiantes." },
  { estado: "Publicado", texto: "Visible en el catálogo. Los estudiantes ya pueden postular." },
  { estado: "En selección", texto: "Tiene postulaciones por revisar — decide a quién aceptar." },
  { estado: "Activo", texto: "El equipo ya está formado y trabajando en los hitos." },
  { estado: "Completado", texto: "El hito final quedó entregado y aprobado — puedes evaluar al equipo." },
  { estado: "Cancelado", texto: "Se cerró antes de tiempo. No se puede reabrir." },
];
// "Suspendido" y "Revisión final" existen como valor de enum pero hoy ningún
// flujo del producto los alcanza (ni gestor, ni moderador, ni admin desde la
// UI) — se excluyen a propósito de esta lista para no explicarle a un
// patrocinador un estado que nunca va a ver.

/** Tarjeta de contexto: qué significa cada estado del ciclo de un proyecto. */
function EstadosInfo() {
  return (
    <div className="rounded-2xl border border-dashed border-electric/30 bg-electric/5 p-5">
      <p className="font-semibold text-ink">Sobre los estados</p>
      <dl className="mt-3 flex flex-col gap-3">
        {ESTADOS_INFO.map((e) => (
          <div key={e.estado}>
            <dt className="text-sm font-medium text-ink">{e.estado}</dt>
            <dd className="mt-0.5 text-xs leading-relaxed text-muted">{e.texto}</dd>
          </div>
        ))}
      </dl>
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
  // Ícono arriba, no al lado: al lado (icono + texto en fila) las 3 caben
  // apenas en un tercio del ancho en mobile — ni con `min-w-0` alcanza
  // espacio real para una palabra larga como "Completados" (medido: ~5px
  // disponibles). Arriba, el texto tiene todo el ancho de la tarjeta.
  return (
    <div className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-white p-3.5 sm:p-5">
      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-xl sm:size-11", TONE_CLASSES[tone])}>
        <Icon className="size-4 sm:size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-lg font-semibold tracking-tight text-ink sm:text-2xl">{valor}</p>
        <p className="text-xs text-muted sm:text-sm">{label}</p>
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

  // Avisos que antes no tenía ninguna señal (hallazgo de auditoría): un
  // publicado sin ninguna postulación hace más de una semana, o un
  // completado con integrantes todavía sin evaluar. Solo uno a la vez, el
  // más relevante para el estado en que está el proyecto.
  const aviso =
    p.diasSinPostulaciones !== null && p.diasSinPostulaciones >= 7
      ? `Publicado hace ${p.diasSinPostulaciones} días, sin postulaciones`
      : p.evaluacionesPendientes > 0
        ? `Faltan ${p.evaluacionesPendientes} ${p.evaluacionesPendientes === 1 ? "evaluación" : "evaluaciones"} del equipo`
        : null;

  return (
    <li className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-white p-6 transition-all hover:border-electric/30 hover:shadow-sm">
      {/* `min-w-0 flex-1` + `truncate`: sin esto, un título largo empujaba al
          grupo de la derecha (badge/equipo/Abrir) a su propia línea al
          envolver, y ahí `justify-between` lo dejaba pegado a la izquierda
          en vez de a la derecha — se veía roto. Ahora el título se trunca
          con "…" y el grupo de la derecha nunca pierde su lugar. */}
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface text-muted">
          <IconCarpeta className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <Link
            href={`/mis-proyectos/${p.id}`}
            className="block truncate font-semibold text-ink transition-colors hover:text-electric"
          >
            {p.titulo}
          </Link>
          <span className="truncate text-xs text-muted">{p.organization?.nombre}</span>
          {aviso && (
            <span className="mt-0.5 block truncate text-xs font-medium text-coral">
              {aviso}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-5">
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
