import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";
import { getProjectsForReview } from "@/features/projects/queries";
import { ModerationControls } from "@/features/projects/components/moderation-controls";
import { VerifiedBadge } from "@/components/ui/verified-badge";

export const metadata: Metadata = {
  title: "Moderación · CampusLab",
};

const MODALIDAD_LABEL: Record<string, string> = {
  remoto: "Remoto",
  presencial: "Presencial",
  hibrido: "Híbrido",
};

/**
 * Cola de moderación (Fase 2). Lista los proyectos en revisión para que un
 * moderador/admin los apruebe (publica) o rechace (vuelve a borrador). Guarda de
 * acceso por rol; la RLS de M18 refuerza que solo el staff lea estos proyectos.
 */
export default async function ModeracionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");
  if (!user.esModerador && !user.esAdmin) redirect("/");

  const pendientes = await getProjectsForReview();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 bg-surface px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-ink">Moderación</h1>
        <p className="text-muted">
          Proyectos en revisión, en orden de llegada. Aprueba para publicarlos o
          recházalos para devolverlos a borrador.
        </p>
      </header>

      <p className="mt-8 text-lg font-semibold text-ink">
        {pendientes.length}{" "}
        {pendientes.length === 1
          ? "proyecto en revisión"
          : "proyectos en revisión"}
      </p>

      {pendientes.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-border bg-white px-6 py-16 text-center">
          <p className="font-medium text-ink">No hay nada por revisar</p>
          <p className="mt-1 text-sm text-muted">
            Cuando una organización envíe un proyecto a revisión, aparecerá aquí.
          </p>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {pendientes.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6"
            >
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-ink">{p.titulo}</h2>
                {p.organization && (
                  <span className="flex items-center gap-1.5 text-sm text-muted">
                    {p.organization.nombre}
                    {p.organization.verificacion === "verificado" && (
                      <VerifiedBadge />
                    )}
                  </span>
                )}
                <span className="text-xs text-muted">
                  {(p.modalidad && (MODALIDAD_LABEL[p.modalidad] ?? p.modalidad)) ||
                    "Modalidad por definir"}{" "}
                  · {p.duracion_semanas} semanas
                </span>
              </div>

              {p.resumen && <p className="text-sm text-muted">{p.resumen}</p>}

              <dl className="grid gap-3 rounded-xl bg-surface p-4 text-sm">
                <div>
                  <dt className="font-medium text-ink">Problema</dt>
                  <dd className="mt-0.5 text-muted">{p.problema}</dd>
                </div>
                <div>
                  <dt className="font-medium text-ink">Alcance</dt>
                  <dd className="mt-0.5 text-muted">{p.alcance}</dd>
                </div>
                <div>
                  <dt className="font-medium text-ink">Entregable</dt>
                  <dd className="mt-0.5 text-muted">{p.entregable}</dd>
                </div>
              </dl>

              {p.roles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {p.roles.map((r) => (
                    <span
                      key={r.id}
                      className="rounded-full bg-electric/10 px-3 py-1 text-xs font-medium text-electric"
                    >
                      {r.nombre} · {r.cupos}{" "}
                      {r.cupos === 1 ? "cupo" : "cupos"}
                    </span>
                  ))}
                </div>
              )}

              <div className="border-t border-border pt-4">
                <ModerationControls projectId={p.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
