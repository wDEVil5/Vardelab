import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/features/auth/queries";
import { getStudentDashboard } from "@/features/dashboard/queries";
import { getPublishedProjects } from "@/features/projects/queries";
import { ProjectCard } from "@/features/projects/components/project-card";
import { PatrocinadorInicio } from "@/features/dashboard/components/patrocinador-inicio";
import { ModeradorInicio } from "@/features/dashboard/components/moderador-inicio";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProyectoCarousel } from "@/features/dashboard/components/proyecto-carousel";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Inicio · CampusLab",
};

/**
 * E-00 · Inicio del estudiante, como panel (dashboard). Jerarquía: una fila de
 * KPI arriba (perfil, postulaciones, pendientes, evidencias), y debajo el
 * progreso del proyecto y sus próximas entregas — si hay más de un proyecto
 * abierto, `ProyectoCarousel` lo vuelve un carrusel en vez de esconder el
 * resto. Los KPI llevan contexto real (no tendencias: no hay histórico con
 * qué comparar). Sin proyecto activo, el espacio cede a una invitación a
 * explorar.
 */
export default async function InicioPage() {
  const user = await getCurrentUser();
  const nombre = (user?.nombre ?? "").split(/\s+/)[0] || "";

  if (user?.esModerador || user?.esAdmin) {
    return <ModeradorInicio nombre={nombre} />;
  }

  if (user?.esPatrocinador && !user?.esEstudiante) {
    return <PatrocinadorInicio nombre={nombre} />;
  }

  const dashboard = await getStudentDashboard();
  const proyectos = dashboard?.proyectosActivos ?? [];
  const activo = proyectos[0] ?? null;
  const perfil = dashboard?.perfil ?? { pct: 0, faltan: [] as string[] };
  const post = dashboard?.postulaciones ?? {
    total: 0,
    aceptadas: 0,
    enRevision: 0,
    rechazadas: 0,
  };
  const pendientes = dashboard?.accionesPendientes ?? 0;
  const evidencias = dashboard?.portafolioCount ?? 0;
  const evaluaciones = dashboard?.evaluaciones ?? [];

  // Recomendados solo cuando no hay proyecto activo (para no cargar de más).
  const recomendados = activo
    ? []
    : (await getPublishedProjects()).slice(0, 3);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8 lg:py-10">
      {/* Encabezado */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Hola, {nombre}.
        </h1>
        {activo && (
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-sm text-muted">
            <span className="size-2 rounded-full bg-sprout" aria-hidden />
            Proyecto en curso
          </span>
        )}
      </header>

      {/* Fila de KPI */}
      <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          href="/perfil"
          icon="perfil"
          valor={`${perfil.pct}%`}
          label="Perfil"
          sub={
            perfil.pct < 100
              ? `faltan ${perfil.faltan.length} ${perfil.faltan.length === 1 ? "campo" : "campos"}`
              : "completo"
          }
          alerta={perfil.pct < 100}
        />
        <KpiCard
          href="/mis-postulaciones"
          icon="postulacion"
          valor={post.total}
          label="Postulaciones"
          sub={
            post.enRevision > 0
              ? `${post.enRevision} en revisión`
              : "ninguna en revisión"
          }
        />
        <KpiCard
          href={activo ? `/proyecto/${activo.id}` : "/proyectos"}
          icon="pendiente"
          valor={pendientes}
          label="Pendientes"
          sub={pendientes > 0 ? "entregas por hacer" : "al día"}
          alerta={pendientes > 0}
        />
        <KpiCard
          href="/perfil"
          icon="evidencia"
          valor={evidencias}
          label="Evidencias"
          sub={evidencias > 0 ? "en tu portafolio" : "suma tu primera"}
        />
      </section>

      {/* Paneles: con más de un proyecto abierto, se convierte en un
          carrusel (puntos + flechas) para moverse entre ellos, en vez de
          mostrar solo el más avanzado y esconder el resto. */}
      {proyectos.length > 0 ? (
        <div className="mt-4">
          <ProyectoCarousel proyectos={proyectos} />
        </div>
      ) : (
        <section className="mt-4 rounded-2xl border border-dashed border-border bg-white p-8">
          <p className="font-medium text-ink">Todavía no estás en un proyecto.</p>
          <p className="mt-1 text-sm text-muted">
            Explora los desafíos abiertos y postula a un rol que encaje con lo que
            sabes hacer.
          </p>
          <Link
            href="/proyectos"
            className={cn(
              "mt-5 inline-flex",
              buttonClasses({ variant: "primary", size: "sm" }),
            )}
          >
            Explorar proyectos
          </Link>
        </section>
      )}

      {/* Evaluaciones recibidas: el gestor ya podía cargarlas desde su panel,
          pero no había ninguna vista para que el estudiante evaluado las
          viera — quedaban invisibles. No depende de tener un proyecto activo:
          también aplica a proyectos ya cerrados. */}
      {evaluaciones.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Evaluaciones recibidas
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {evaluaciones.map((e) => (
              <li
                key={e.projectId}
                className="rounded-2xl border border-border bg-white p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/proyecto/${e.projectId}`}
                    className="font-medium text-ink transition-colors hover:text-electric"
                  >
                    {e.projectTitulo}
                  </Link>
                  {e.puntaje != null && (
                    <Badge tone="brand">{e.puntaje}/5</Badge>
                  )}
                </div>
                {e.comentario && (
                  <p className="mt-2 text-sm text-muted">{e.comentario}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recomendados (solo sin proyecto activo) */}
      {!activo && recomendados.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Para ti
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recomendados.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* — Piezas presentacionales (sin estado; render en el servidor) — */

type IconName = "perfil" | "postulacion" | "pendiente" | "evidencia";

// Íconos mínimos en línea (trazo), para no cargar una librería.
function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, string> = {
    perfil: "M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0",
    postulacion: "M4 4h16v16H4zM4 9h16M9 4v16",
    pendiente: "M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z",
    evidencia: "M4 7h6l2 2h8v9a2 2 0 01-2 2H4z",
  };
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={paths[name]} />
    </svg>
  );
}

function KpiCard({
  href,
  icon,
  valor,
  label,
  sub,
  alerta = false,
}: {
  href: string;
  icon: IconName;
  valor: string | number;
  label: string;
  sub: string;
  alerta?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-border bg-white p-5 transition-colors hover:border-electric/40"
    >
      <span
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-full",
          alerta
            ? "bg-electric/10 text-electric"
            : "bg-surface text-muted",
        )}
      >
        <Icon name={icon} />
      </span>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-ink">
        {valor}
      </p>
      <p className="text-sm font-medium text-ink">{label}</p>
      <p className={cn("text-xs", alerta ? "text-electric" : "text-muted")}>
        {sub}
      </p>
    </Link>
  );
}

