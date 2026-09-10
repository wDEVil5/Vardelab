import Link from "next/link";
import { getProjectsForReview } from "@/features/projects/queries";
import { getPendingLeads } from "@/features/leads/queries";

// Tipo del lead → etiqueta legible.
const LEAD_TIPO_LABEL: Record<string, string> = {
  contacto_organizacion: "Contacto",
  propuesta_desafio: "Propuesta",
};

/**
 * Inicio del moderador — paso 2 (+ leads pendientes). Inspirado en el mockup de
 * Figma "M-00 · Resumen" (KPIs + cola de revisión), adaptado a los datos
 * reales: sin "Reportes" ni "Riesgo" (existen las tablas M7, pero sin ninguna
 * funcionalidad construida encima) y sin "Resueltos hoy" (no hay registro de
 * decisiones con fecha todavía). Los leads son de solo lectura por ahora: el
 * panel de gestión (marcar contactado/descartado) es un frente aparte.
 */
export async function ModeradorInicio({ nombre }: { nombre: string }) {
  const [pendientes, leads] = await Promise.all([
    getProjectsForReview(),
    getPendingLeads(),
  ]);

  return (
    <div className="w-full px-6 py-8 lg:px-10 lg:py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Hola, {nombre}.
        </h1>
        <p className="mt-1 text-muted">Tu resumen de moderación.</p>
      </header>

      {/* KPIs */}
      <div className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Pendientes de revisión" value={pendientes.length} />
        <StatCard label="Leads pendientes" value={leads.length} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Cola de revisión */}
        <div className="rounded-2xl border border-border bg-white p-6">
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
                    href="/moderacion"
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
            <p className="mt-3 text-sm text-muted">
              No hay proyectos por revisar.
            </p>
          )}
        </div>

        {/* Leads pendientes: de solo lectura (el panel de gestión es aparte). */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-semibold text-ink">Leads pendientes</h2>

          {leads.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-2">
              {leads.slice(0, 5).map((l) => (
                <li
                  key={l.id}
                  className="rounded-lg border border-border p-3"
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
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">No hay leads pendientes.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-3xl font-bold text-ink">{value}</p>
    </div>
  );
}
