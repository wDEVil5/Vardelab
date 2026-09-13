import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { OrgLogo } from "@/components/ui/org-logo";
import { cn } from "@/lib/utils";
import { getMyProjects } from "@/features/projects/queries";
import { getMyOrganizations } from "@/features/organizations/queries";
import { getRecentApplicationsForSponsor } from "@/features/applications/queries";
import { getUpcomingMilestonesForSponsor } from "@/features/milestones/queries";

// Estado del proyecto → etiqueta y tono (consistente con /mis-proyectos).
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

// Verificación de la organización → etiqueta y tono.
const VERIFICACION: Record<string, { label: string; tone: BadgeTone }> = {
  verificado: { label: "Verificada", tone: "success" },
  en_revision: { label: "En revisión", tone: "brand" },
  sin_verificar: { label: "Sin verificar", tone: "neutral" },
};

// Estado de una postulación → etiqueta y tono.
const POSTULACION_ESTADO: Record<string, { label: string; tone: BadgeTone }> = {
  enviada: { label: "Enviada", tone: "brand" },
  aceptada: { label: "Aceptada", tone: "success" },
  rechazada: { label: "Rechazada", tone: "danger" },
  retirada: { label: "Retirada", tone: "neutral" },
};

// Tono del estado del proyecto → color del ícono de carpeta en la lista.
const ICONO_TONE_CLASSES: Partial<Record<BadgeTone, string>> = {
  brand: "bg-electric/10 text-electric",
  success: "bg-sprout/15 text-sprout",
  danger: "bg-coral/15 text-coral",
  neutral: "bg-surface text-muted",
};

// "Equipo" resume dónde está el proyecto en el ciclo aceptar → formar equipo
// (mismo criterio que /mis-proyectos).
function equipoTexto(equipoTamano: number, postulacionesPendientes: number): string {
  if (equipoTamano > 0) {
    return `${equipoTamano} ${equipoTamano === 1 ? "estudiante" : "estudiantes"}`;
  }
  if (postulacionesPendientes > 0) {
    return `${postulacionesPendientes} ${postulacionesPendientes === 1 ? "postulación" : "postulaciones"}`;
  }
  return "Sin equipo";
}

const FORMATO_FECHA = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short" });

// "Vence hoy" / "vencido hace 2 días" / "en 5 días" — más legible que la fecha
// cruda para decidir qué hito mirar primero.
function formatearVencimiento(fechaLimite: string): { texto: string; vencido: boolean } {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const limite = new Date(fechaLimite);
  limite.setHours(0, 0, 0, 0);
  const dias = Math.round((limite.getTime() - hoy.getTime()) / 86_400_000);

  if (dias < 0) return { texto: `Vencido hace ${Math.abs(dias)} ${Math.abs(dias) === 1 ? "día" : "días"}`, vencido: true };
  if (dias === 0) return { texto: "Vence hoy", vencido: true };
  if (dias === 1) return { texto: "Vence mañana", vencido: false };
  return { texto: `Vence en ${dias} días`, vencido: false };
}

/**
 * Inicio del patrocinador: panorama de sus organizaciones y proyectos, con lo
 * que necesita su atención primero (observaciones de un moderador,
 * postulaciones sin revisar) y accesos directos para no tener que navegar a
 * las listas solo para crear algo. Server Component: la RLS limita a lo
 * propio.
 */
export async function PatrocinadorInicio({ nombre }: { nombre: string }) {
  const [proyectos, organizaciones, postulacionesRecientes, hitosProximos] = await Promise.all([
    getMyProjects(),
    getMyOrganizations(),
    getRecentApplicationsForSponsor(5),
    getUpcomingMilestonesForSponsor(5),
  ]);

  const publicados = proyectos.filter((p) => p.status === "publicado").length;
  const postulacionesPendientes = proyectos.reduce(
    (total, p) => total + p.postulacionesPendientes,
    0,
  );
  const sinOrganizacion = organizaciones.length === 0;
  const conObservaciones = proyectos.filter(
    (p) => p.status === "borrador" && p.comentario_moderacion,
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            Hola, {nombre} <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1 text-muted">
            Tu resumen como organización: proyectos, equipos y su estado.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/mis-organizaciones/nueva"
            className={buttonClasses({ variant: "secondary", size: "sm" })}
          >
            Nueva organización
          </Link>
          <Link
            href="/mis-proyectos/nuevo"
            className={buttonClasses({ variant: "primary", size: "sm" })}
          >
            Nuevo proyecto
          </Link>
        </div>
      </header>

      {/* KPIs */}
      <div className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Organizaciones" value={organizaciones.length} icon={IconBuilding} />
        <StatCard label="Proyectos" value={proyectos.length} icon={IconCarpeta} />
        <StatCard label="Publicados" value={publicados} icon={IconCheck} />
        <StatCard
          label="Postulaciones por revisar"
          value={postulacionesPendientes}
          icon={IconBandeja}
          alerta={postulacionesPendientes > 0}
        />
      </div>

      {/* Qué necesita atención primero: sin organización bloquea todo lo
          demás, así que va antes que cualquier otro aviso. */}
      {sinOrganizacion ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-white p-6">
          <div>
            <p className="font-medium text-ink">Primero crea una organización</p>
            <p className="mt-1 text-sm text-muted">
              Un proyecto se publica siempre bajo una organización propia.
            </p>
          </div>
          <Link
            href="/mis-organizaciones/nueva"
            className="text-sm font-medium text-electric hover:underline"
          >
            Crear organización →
          </Link>
        </div>
      ) : (
        conObservaciones.length > 0 && (
          <section className="mt-6 flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Necesitan tu atención
            </h2>
            {conObservaciones.map((p) => (
              <Link
                key={p.id}
                href={`/mis-proyectos/${p.id}/observaciones`}
                className="flex flex-col gap-1 rounded-2xl border border-coral/30 bg-coral/5 p-5 transition-colors hover:bg-coral/10"
              >
                <p className="text-sm font-medium text-ink">
                  El moderador pidió cambios en &ldquo;{p.titulo}&rdquo;
                </p>
                <p className="line-clamp-1 text-sm text-muted">{p.comentario_moderacion}</p>
              </Link>
            ))}
          </section>
        )
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Últimas postulaciones */}
        <Card
          title="Últimas postulaciones"
          action={
            postulacionesRecientes.length > 0
              ? { href: "/postulaciones", label: "Ver todas →" }
              : undefined
          }
        >
          {postulacionesRecientes.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {postulacionesRecientes.map((a) => {
                const estado = POSTULACION_ESTADO[a.status] ?? {
                  label: a.status,
                  tone: "neutral" as BadgeTone,
                };
                return (
                  <li key={a.id}>
                    <Link
                      href={`/mis-proyectos/${a.projectId}/postulaciones`}
                      className="flex items-center gap-3 rounded-xl border border-border p-3 transition-all hover:border-electric/30 hover:shadow-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">
                          {a.applicant?.nombre ?? "Estudiante"}
                          {a.roleNombre && (
                            <span className="font-normal text-muted"> · {a.roleNombre}</span>
                          )}
                        </p>
                        <p className="truncate text-xs text-muted">{a.projectTitulo}</p>
                      </div>
                      <Badge tone={estado.tone}>{estado.label}</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted">Todavía no llegan postulaciones.</p>
          )}
        </Card>

        {/* Próximos hitos */}
        <Card title="Próximos hitos">
          {hitosProximos.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {hitosProximos.map((h) => {
                const venc = formatearVencimiento(h.fecha_limite);
                return (
                  <li key={h.id}>
                    <Link
                      href={`/mis-proyectos/${h.projectId}/seguimiento`}
                      className="flex items-center gap-3 rounded-xl border border-border p-3 transition-all hover:border-electric/30 hover:shadow-sm"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface text-muted">
                        <IconCalendario className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{h.titulo}</p>
                        <p className="truncate text-xs text-muted">{h.projectTitulo}</p>
                      </div>
                      <Badge tone={venc.vencido ? "danger" : "neutral"} className="shrink-0">
                        {venc.texto}
                      </Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted">No hay hitos con fecha próxima.</p>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Proyectos */}
        <Card
          title="Tus proyectos"
          className="lg:col-span-2"
          action={
            proyectos.length > 0
              ? { href: "/mis-proyectos", label: "Ver todos →" }
              : undefined
          }
        >
          {proyectos.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {proyectos.slice(0, 5).map((p) => {
                const estado = ESTADO[p.status] ?? {
                  label: p.status,
                  tone: "neutral" as BadgeTone,
                };
                const meta = [
                  p.organization?.nombre,
                  equipoTexto(p.equipoTamano, p.postulacionesPendientes),
                  FORMATO_FECHA.format(new Date(p.created_at)),
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <li key={p.id}>
                    <Link
                      href={`/mis-proyectos/${p.id}`}
                      className="flex items-center gap-3 rounded-xl border border-border p-3 transition-all hover:border-electric/30 hover:shadow-sm"
                    >
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-lg",
                          ICONO_TONE_CLASSES[estado.tone],
                        )}
                      >
                        <IconCarpeta className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">
                          {p.titulo}
                        </p>
                        <p className="truncate text-xs text-muted">{meta}</p>
                      </div>
                      <Badge tone={estado.tone}>{estado.label}</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted">
                Todavía no publicaste ningún proyecto.
              </p>
              {!sinOrganizacion && (
                <Link
                  href="/mis-proyectos/nuevo"
                  className="text-sm font-medium text-electric hover:underline"
                >
                  Crear proyecto →
                </Link>
              )}
            </div>
          )}
        </Card>

        {/* Organizaciones */}
        <Card
          title="Tus organizaciones"
          action={
            organizaciones.length > 0
              ? { href: "/mis-organizaciones", label: "Ver todas →" }
              : undefined
          }
        >
          {organizaciones.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {organizaciones.slice(0, 5).map((o) => {
                const v = VERIFICACION[o.verificacion ?? "sin_verificar"] ?? {
                  label: o.verificacion ?? "",
                  tone: "neutral" as BadgeTone,
                };
                return (
                  <li key={o.id}>
                    <Link
                      href={`/mis-organizaciones/${o.id}/editar`}
                      className="flex items-center gap-3 rounded-xl border border-border p-3 transition-all hover:border-electric/30 hover:shadow-sm"
                    >
                      <OrgLogo logoUrl={o.logo_url} nombre={o.nombre} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                        {o.nombre}
                      </span>
                      <Badge tone={v.tone}>{v.label}</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted">
              Aún no tienes organizaciones.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

// Contenedor de widget con título y acción opcional a la derecha.
function Card({
  title,
  action,
  className,
  children,
}: {
  title: string;
  action?: { href: string; label: string };
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-border bg-white p-6",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-ink">{title}</h2>
        {action && (
          <Link
            href={action.href}
            className="shrink-0 text-sm font-medium text-electric hover:underline"
          >
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  alerta = false,
}: {
  label: string;
  value: number;
  icon: (props: { className?: string }) => React.JSX.Element;
  alerta?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-6 shadow-sm">
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-full",
          alerta ? "bg-coral/10 text-coral" : "bg-electric/10 text-electric",
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="flex flex-col">
        <p className="text-3xl font-bold tracking-tight text-ink">{value}</p>
        <p className="text-sm text-muted">{label}</p>
      </div>
    </div>
  );
}

function IconBuilding({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16" />
      <path d="M13 21V9a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v12" />
      <path d="M9 8h.01M9 12h.01M9 16h.01" />
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

function IconCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </svg>
  );
}

function IconBandeja({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12h4l2 3h4l2-3h4" />
      <path d="M5.5 6h13l1.5 6v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6z" />
    </svg>
  );
}

function IconCalendario({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}
