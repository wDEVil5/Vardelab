import Link from "next/link";
import { cn } from "@/lib/utils";
import { getProjectsForReview } from "@/features/projects/queries";
import { getPendingLeads } from "@/features/leads/queries";
import { getOpenReports } from "@/features/reports/queries";

// Tipo del lead → etiqueta legible.
const LEAD_TIPO_LABEL: Record<string, string> = {
  contacto_organizacion: "Contacto",
  propuesta_desafio: "Propuesta",
};

/**
 * Inicio del moderador. Inspirado en el mockup de Figma "M-00 · Resumen" (KPIs
 * + cola de revisión), adaptado a los datos reales: sin "Riesgo" (no existe en
 * el modelo) ni "Resueltos hoy" (no hay registro de decisiones con fecha
 * todavía). Cada vista rápida enlaza a su panel completo.
 */
export async function ModeradorInicio({ nombre }: { nombre: string }) {
  const [pendientes, leads, reportes] = await Promise.all([
    getProjectsForReview(),
    getPendingLeads(),
    getOpenReports(),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8 lg:py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Hola, {nombre}.
        </h1>
        <p className="mt-1 text-muted">Tu resumen de moderación.</p>
      </header>

      {/* KPIs: tres, así que tres columnas (nada de dejar huecos vacíos). */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <StatCard
          href="/moderacion"
          label="Pendientes de revisión"
          value={pendientes.length}
          tone="electric"
        />
        <StatCard href="/leads" label="Leads pendientes" value={leads.length} />
        <StatCard
          href="/moderacion/reportes"
          label="Reportes abiertos"
          value={reportes.length}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Cola de revisión */}
        <div className="flex min-h-52 flex-col rounded-2xl border border-border bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-ink">Cola de revisión</h2>
            {pendientes.length > 0 && (
              <Link
                href="/moderacion"
                className="shrink-0 text-sm font-medium text-electric hover:underline"
              >
                Ir a moderación →
              </Link>
            )}
          </div>

          {pendientes.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-2">
              {pendientes.slice(0, 5).map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/moderacion/${p.id}`}
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
                    <span className="shrink-0 text-sm font-medium text-electric">
                      Revisar
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState mensaje="No hay proyectos por revisar." />
          )}
        </div>

        {/* Leads pendientes: vista rápida; la gestión completa vive en /leads. */}
        <div className="flex min-h-52 flex-col rounded-2xl border border-border bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-ink">Leads pendientes</h2>
            {leads.length > 0 && (
              <Link
                href="/leads"
                className="shrink-0 text-sm font-medium text-electric hover:underline"
              >
                Ver todos →
              </Link>
            )}
          </div>

          {leads.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-2">
              {leads.slice(0, 5).map((l) => (
                <li key={l.id}>
                  <Link
                    href="/leads"
                    className="block rounded-lg border border-border p-3 transition-colors hover:border-electric/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium text-ink">
                        {l.nombre}
                      </p>
                      <span className="shrink-0 text-xs text-muted">
                        {LEAD_TIPO_LABEL[l.tipo] ?? l.tipo}
                      </span>
                    </div>
                    {l.organizacion && (
                      <p className="truncate text-xs text-muted">
                        {l.organizacion}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState mensaje="No hay leads pendientes." />
          )}
        </div>
      </div>
    </div>
  );
}

// Estado vacío: centrado en el espacio disponible de la tarjeta, para que no
// quede como un renglón de texto perdido arriba de un hueco en blanco.
function EmptyState({ mensaje }: { mensaje: string }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-sm text-muted">{mensaje}</p>
    </div>
  );
}

function StatCard({
  href,
  label,
  value,
  tone = "ink",
}: {
  href: string;
  label: string;
  value: number;
  tone?: "electric" | "ink";
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-border bg-white p-5 transition-colors hover:border-electric/40"
    >
      <p className={cn("text-3xl font-bold", tone === "electric" ? "text-electric" : "text-ink")}>
        {value}
      </p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </Link>
  );
}
