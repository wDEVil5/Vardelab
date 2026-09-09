import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getMyProjects } from "@/features/projects/queries";
import { getMyOrganizations } from "@/features/organizations/queries";

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

/**
 * Inicio del patrocinador (versión básica, sin Figma). Panel con sus datos
 * reales: KPIs de organizaciones y proyectos, la lista de proyectos con su
 * estado y la de organizaciones con su verificación. Server Component: la RLS
 * limita a lo propio. Los dashboards de moderador/admin siguen pendientes.
 */
export async function PatrocinadorInicio({ nombre }: { nombre: string }) {
  const [proyectos, organizaciones] = await Promise.all([
    getMyProjects(),
    getMyOrganizations(),
  ]);

  const publicados = proyectos.filter((p) => p.status === "publicado").length;
  const enRevision = proyectos.filter((p) => p.status === "en_revision").length;
  const sinOrganizacion = organizaciones.length === 0;

  return (
    <div className="w-full px-6 py-8 lg:px-10 lg:py-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Hola, {nombre} <span aria-hidden>👋</span>
        </h1>
        <p className="mt-1 text-muted">
          Tu resumen como organización: proyectos y su estado.
        </p>
      </header>

      {/* KPIs */}
      <div className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Organizaciones" value={String(organizaciones.length)} tone="electric" />
        <StatCard label="Proyectos" value={String(proyectos.length)} tone="ink" />
        <StatCard label="Publicados" value={String(publicados)} tone="sprout" />
        <StatCard label="En revisión" value={String(enRevision)} tone="coral" />
      </div>

      {/* Aviso: sin organización no se puede publicar. */}
      {sinOrganizacion && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-white p-6">
          <div>
            <p className="font-medium text-ink">Primero creá una organización</p>
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
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
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
                return (
                  <li key={p.id}>
                    <Link
                      href={`/mis-proyectos/${p.id}`}
                      className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-electric/40"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">
                          {p.titulo}
                        </p>
                        {p.organization?.nombre && (
                          <p className="truncate text-xs text-muted">
                            {p.organization.nombre}
                          </p>
                        )}
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
                      className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-electric/40"
                    >
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
              Aún no tenés organizaciones.
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
  tone,
}: {
  label: string;
  value: string;
  tone: "electric" | "sprout" | "coral" | "ink";
}) {
  const color = {
    electric: "text-electric",
    sprout: "text-sprout",
    coral: "text-coral",
    ink: "text-ink",
  }[tone];
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className={cn("mt-2 text-3xl font-bold", color)}>{value}</p>
    </div>
  );
}
