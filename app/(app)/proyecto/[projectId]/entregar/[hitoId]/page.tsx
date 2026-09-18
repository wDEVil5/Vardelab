import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/features/auth/queries";
import { getMilestoneWithSubmissionsById } from "@/features/milestones/queries";
import { MilestoneSubmissions } from "@/features/submissions/components/milestone-submissions";

export const metadata: Metadata = {
  title: "Entregar evidencia · Vardelab",
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

  const hito = await getMilestoneWithSubmissionsById(hitoId);
  if (!hito || hito.project_id !== projectId) notFound();

  const volver = `/proyecto/${projectId}`;
  // El checklist es una guía de "qué necesita una buena entrega" — no aplica
  // a un hito ya cerrado, donde no hay nada más para entregar.
  const aprobado = hito.estado === "aprobado";

  return (
    // Más angosto cuando está aprobado: sin el checklist al lado, una
    // tarjeta sola en un ancho pensado para dos columnas quedaba perdida a
    // la izquierda de un espacio vacío en vez de sentirse intencional.
    <div className={cn("mx-auto w-full px-6 py-8 lg:py-10", aprobado ? "max-w-2xl" : "max-w-4xl")}>
      <header className="flex flex-col gap-2">
        <Link
          href={volver}
          className="text-sm text-muted transition-colors hover:text-ink"
        >
          ← Volver al proyecto
        </Link>
        <h1 className="text-2xl font-bold text-ink">Entregar evidencia</h1>
      </header>

      <div className={cn("mt-8 grid items-start gap-4", !aprobado && "lg:grid-cols-[1fr_18rem]")}>
        {/* Entregas ya hechas (si las hay) + formulario para subir una nueva —
            antes esta pantalla siempre mostraba un formulario en blanco, sin
            forma de ver qué se había entregado ya ni si el gestor pidió
            cambios. */}
        <MilestoneSubmissions
          milestone={hito}
          projectId={projectId}
          currentUserId={user.id}
        />

        {/* Checklist (guía de "qué necesita una buena entrega"): solo tiene
            sentido si todavía hay algo por entregar. */}
        {!aprobado && (
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
        )}
      </div>
    </div>
  );
}
