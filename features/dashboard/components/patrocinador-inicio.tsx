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

// Fila de las 4 listas del inicio: antes cada una era su propia caja con
// borde (una caja adentro de la caja de la Card, "cuadriculado"); ahora es
// una fila lisa dentro de una lista con `divide-y`, con un tinte de fondo al
// pasar el mouse en vez de aparecer un borde nuevo — una sola caja visible
// por sección, no una por fila.
const ROW_CLASS =
  "flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface/70";

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
  // Un proyecto cancelado puede seguir con postulaciones `enviada` sin
  // transicionar (M60 no las toca) — no cuentan para "necesita revisión": no
  // hay nada que aceptar en un proyecto que ya no sigue. Mismo criterio que
  // getPendingApplicationsForSponsor (/postulaciones), que además ya las
  // excluye de la bandeja real.
  const postulacionesPendientes = proyectos
    .filter((p) => p.status !== "cancelado")
    .reduce((total, p) => total + p.postulacionesPendientes, 0);
  const sinOrganizacion = organizaciones.length === 0;
  const conObservaciones = proyectos.filter(
    (p) => p.status === "borrador" && p.comentario_moderacion,
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:py-10">
      {/* Bienvenida: mismo lenguaje que /ingresar (acentos geométricos
          borrosos en electric/sprout sobre una tarjeta blanca) en vez del
          título suelto de antes — es la primera pantalla que ve el
          patrocinador, y el resto del sitio ya reserva ese tratamiento para
          las pantallas de "primera impresión" (landing, auth), no para
          listas utilitarias. */}
      <header className="relative overflow-hidden rounded-3xl border border-border bg-white p-8">
        <div
          className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-electric/10 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-10 right-24 size-24 rounded-full bg-sprout/15 blur-xl"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink lg:text-4xl">
              Hola, {nombre}
            </h1>
            <p className="mt-2 text-muted">
              Tu resumen como organización: proyectos, equipos y su estado.
            </p>
          </div>
          {/* `flex-wrap` a tamaño natural (no `w-full`): forzar los botones
              a ancho completo los hacía ver como 2 banners apilados en vez
              de acciones secundarias. Con `flex-wrap` simple, si no entran
              lado a lado pasan a su propia línea, pero cada uno conserva su
              tamaño natural — nunca se parte el texto adentro porque cada
              botón, aun solo en su línea, tiene de sobra. */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/mis-organizaciones/nueva"
              className={buttonClasses({ variant: "outline", size: "sm" })}
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
        </div>
      </header>

      {/* Sin organización, bloquea todo lo demás: nada de "0 proyectos, 0
          publicados, todavía no llegan postulaciones..." repetido seis veces
          por la pantalla — un patrocinador recién llegado solo necesita ver
          este único llamado a la acción, no un dashboard lleno de ceros. */}
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
        <>
          {/* KPIs: cada uno con su propio color de familia (no los 4 en el
              mismo azul pálido) para que se lean como cuatro señales
              distintas, no cuatro copias del mismo componente con un número
              distinto. Los tres primeros llevan a su lista completa;
              "Postulaciones por revisar" es la señal más accionable de la
              pantalla y antes no tenía ningún link — había que bajar hasta
              "Últimas postulaciones" para encontrar el mismo destino. */}
          <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard
              href="/mis-organizaciones"
              label="Organizaciones"
              value={organizaciones.length}
              icon={IconBuilding}
              tone="electric"
            />
            <StatCard
              href="/mis-proyectos"
              label="Proyectos"
              value={proyectos.length}
              icon={IconCarpeta}
              tone="ink"
            />
            <StatCard
              href="/mis-proyectos"
              label="Publicados"
              value={publicados}
              icon={IconCheck}
              tone="sprout"
            />
            <StatCard
              href="/postulaciones"
              label="Postulaciones por revisar"
              value={postulacionesPendientes}
              icon={IconBandeja}
              tone={postulacionesPendientes > 0 ? "coral" : "ink"}
            />
          </div>

          {conObservaciones.length > 0 && (
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
          )}

          {/* `grid-cols-1` base: sin esto, por debajo de `lg:` el grid no
              tenía ninguna columna definida — el contenido (badges
              `shrink-0` + texto) empujaba la tarjeta más ancha que su
              columna en vez de quedar contenido (mismo bug ya visto en
              app/(site)/page.tsx, sección "Mis proyectos"). */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
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
            <ul className="-mx-2 flex flex-col divide-y divide-border">
              {postulacionesRecientes.map((a) => {
                const estado = POSTULACION_ESTADO[a.status] ?? {
                  label: a.status,
                  tone: "neutral" as BadgeTone,
                };
                return (
                  <li key={a.id} className="min-w-0">
                    <Link
                      href={`/mis-proyectos/${a.projectId}/postulaciones`}
                      className={ROW_CLASS}
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
            <ul className="-mx-2 flex flex-col divide-y divide-border">
              {hitosProximos.map((h) => {
                const venc = formatearVencimiento(h.fecha_limite);
                return (
                  <li key={h.id} className="min-w-0">
                    <Link href={`/mis-proyectos/${h.projectId}/seguimiento`} className={ROW_CLASS}>
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

      {/* `grid-cols-1` base: mismo motivo que arriba. */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
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
            <ul className="-mx-2 flex flex-col divide-y divide-border">
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
                  <li key={p.id} className="min-w-0">
                    <Link href={`/mis-proyectos/${p.id}`} className={ROW_CLASS}>
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
            <ul className="-mx-2 flex flex-col divide-y divide-border">
              {organizaciones.slice(0, 5).map((o) => {
                const v = VERIFICACION[o.verificacion ?? "sin_verificar"] ?? {
                  label: o.verificacion ?? "",
                  tone: "neutral" as BadgeTone,
                };
                return (
                  <li key={o.id} className="min-w-0">
                    <Link href={`/mis-organizaciones/${o.id}/editar`} className={ROW_CLASS}>
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
        </>
      )}
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

const STAT_TONE_CLASSES = {
  electric: "bg-electric/10 text-electric",
  ink: "bg-ink/5 text-ink",
  sprout: "bg-sprout/15 text-sprout",
  coral: "bg-coral/10 text-coral",
} as const;

// `href`: cada KPI lleva a su lista completa — la de "Postulaciones por
// revisar" en particular es la señal más accionable de la pantalla y antes
// no era clicable en absoluto.
function StatCard({
  href,
  label,
  value,
  icon: Icon,
  tone,
}: {
  href: string;
  label: string;
  value: number;
  icon: (props: { className?: string }) => React.JSX.Element;
  tone: keyof typeof STAT_TONE_CLASSES;
}) {
  return (
    // Ícono arriba, no al lado: con `min-w-0` el texto ya no rompía el
    // layout, pero medido con `scrollWidth` seguía sin caber de verdad
    // ("Organizaciones" pintaba 54px fuera de su caja, invisibles a un
    // chequeo de `getBoundingClientRect` porque el texto no tiene dónde
    // partirse — es una sola palabra). Arriba, el texto tiene todo el
    // ancho de la tarjeta para sí.
    <Link
      href={href}
      className="flex flex-col items-start gap-2.5 rounded-2xl border border-border bg-white p-4 shadow-sm transition-all hover:border-electric/30 hover:shadow-md sm:p-6"
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full sm:size-12",
          STAT_TONE_CLASSES[tone],
        )}
      >
        <Icon className="size-4 sm:size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-bold tracking-tight text-ink sm:text-3xl">{value}</p>
        <p className="text-sm text-muted">{label}</p>
      </div>
    </Link>
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
