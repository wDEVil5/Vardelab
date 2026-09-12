import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { getCurrentUser } from "@/features/auth/queries";
import { getPendingApplicationsForSponsor } from "@/features/applications/queries";

export const metadata: Metadata = {
  title: "Postulaciones · CampusLab",
};

// Fecha de postulación en términos relativos y sin ambigüedad.
function haceCuanto(iso: string): string {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dias <= 0) return "Hoy";
  if (dias === 1) return "Ayer";
  if (dias < 7) return `Hace ${dias} días`;
  if (dias < 30) return `Hace ${Math.floor(dias / 7)} sem`;
  const meses = Math.floor(dias / 30);
  return meses <= 1 ? "Hace 1 mes" : `Hace ${meses} meses`;
}

// Iniciales del postulante para el avatar circular: "Wilnes M." → "WM".
function iniciales(nombre: string | null): string {
  if (!nombre) return "?";
  const partes = nombre.trim().split(/\s+/);
  return partes
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Bandeja de entrada del patrocinador (S-04): todas las postulaciones
 * pendientes de revisar, juntas, sin importar a qué proyecto pertenezcan.
 * Antes solo se llegaba a las postulaciones entrando a cada proyecto por
 * separado; esto era lo que faltaba en el sidebar. Revisar/aceptar sigue
 * pasando en la página del proyecto (`/mis-proyectos/[id]/postulaciones`).
 */
export default async function PostulacionesPatrocinadorPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar?next=/postulaciones");
  if (!user.esPatrocinador) redirect("/inicio");

  const pendientes = await getPendingApplicationsForSponsor();
  const proyectos = new Set(pendientes.map((p) => p.projectId)).size;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink">Postulaciones</h1>
        <p className="text-sm text-muted">
          Todo lo que está esperando tu revisión, junto.
        </p>
      </header>

      {pendientes.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
          <p className="font-medium text-ink">No hay postulaciones pendientes</p>
          <p className="mt-1 text-sm text-muted">
            Cuando alguien postule a uno de tus proyectos, aparece acá.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-10 flex flex-wrap gap-5">
            <KpiStat valor={pendientes.length} label="Pendientes" />
            <KpiStat valor={proyectos} label={proyectos === 1 ? "Proyecto" : "Proyectos"} />
          </div>

          <ul className="mt-8 flex flex-col gap-4">
            {pendientes.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-electric/10 text-sm font-semibold text-electric">
                    {iniciales(p.applicant?.nombre ?? null)}
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-ink">
                      {p.applicant?.nombre ?? "Postulante"}
                      {p.applicant?.carrera && (
                        <span className="font-normal text-muted"> · {p.applicant.carrera}</span>
                      )}
                    </span>
                    <span className="text-xs text-muted">
                      {p.projectTitulo} · {p.roleNombre} · {haceCuanto(p.created_at)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:shrink-0">
                  <Badge tone="brand">Nueva</Badge>
                  <Link
                    href={`/mis-proyectos/${p.projectId}/postulaciones`}
                    className={buttonClasses({ variant: "outline-primary", size: "sm" })}
                  >
                    Revisar
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function KpiStat({ valor, label }: { valor: number; label: string }) {
  return (
    <div className="w-36 shrink-0 rounded-2xl border border-border bg-white p-6">
      <p className="text-2xl font-semibold tracking-tight text-ink">{valor}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}
