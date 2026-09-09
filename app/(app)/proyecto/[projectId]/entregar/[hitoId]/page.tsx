import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";
import { getMilestoneById } from "@/features/milestones/queries";
import { SubmitEvidenceForm } from "@/features/submissions/components/submit-evidence-form";

export const metadata: Metadata = {
  title: "Entregar evidencia · CampusLab",
};

type PageProps = { params: Promise<{ projectId: string; hitoId: string }> };

// Puntos de una entrega bien hecha (guía estática, no validación).
const CHECKLIST = [
  "Descripción clara",
  "Enlace válido y accesible",
  "Muestra lo que hiciste",
  "Sin datos sensibles",
];

/**
 * E-06 · Entregar evidencia de un hito. La RLS deja ver el hito solo a
 * integrantes y gestor; si no existe o no pertenece a este proyecto → 404.
 * Requiere sesión.
 */
export default async function EntregarPage({ params }: PageProps) {
  const { projectId, hitoId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/ingresar?next=/proyecto/${projectId}/entregar/${hitoId}`);
  }

  const hito = await getMilestoneById(hitoId);
  if (!hito || hito.project_id !== projectId) notFound();

  const volver = `/proyecto/${projectId}`;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 lg:py-10">
      <header className="flex flex-col gap-2">
        <Link
          href={volver}
          className="text-sm text-muted transition-colors hover:text-ink"
        >
          ← Volver al proyecto
        </Link>
        <h1 className="text-2xl font-bold text-ink">Entregar evidencia</h1>
        <p className="text-sm text-muted">
          Hito: <span className="text-ink">{hito.titulo}</span>
        </p>
      </header>

      <div className="mt-8 grid items-start gap-4 lg:grid-cols-[1fr_18rem]">
        {/* Formulario */}
        <section className="rounded-2xl border border-border bg-white p-6">
          <h2 className="text-lg font-semibold text-ink">Entrega del hito</h2>
          <div className="mt-4">
            <SubmitEvidenceForm
              milestoneId={hito.id}
              projectId={projectId}
              redirectTo={volver}
            />
          </div>
        </section>

        {/* Checklist (guía) */}
        <aside className="rounded-2xl border border-electric/15 bg-electric/5 p-6">
          <h2 className="text-base font-semibold text-ink">Checklist</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-ink">
                <svg
                  viewBox="0 0 24 24"
                  className="mt-0.5 size-4 shrink-0 text-electric"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
