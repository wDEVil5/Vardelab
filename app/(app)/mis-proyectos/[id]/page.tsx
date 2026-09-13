import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { getCurrentUser } from "@/features/auth/queries";
import {
  getManagedProject,
  type ManagedProject,
} from "@/features/projects/queries";
import { deleteRole } from "@/features/projects/actions";
import { AddRoleModal } from "@/features/projects/components/add-role-modal";
import { RoleSkillsEditor } from "@/features/projects/components/role-skills-editor";
import { PublishControls } from "@/features/projects/components/publish-controls";
import { DeleteProjectButton } from "@/features/projects/components/delete-project-button";
import { getActiveSkills, type Skill } from "@/features/skills/queries";
import { getTeamForEvaluation } from "@/features/evaluations/queries";
import { MemberEvaluationForm } from "@/features/evaluations/components/member-evaluation-form";

export const metadata: Metadata = {
  title: "Gestionar proyecto · CampusLab",
};

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

type PageProps = { params: Promise<{ id: string }> };

/** Gestión de un proyecto por su patrocinador: datos y roles. */
export default async function GestionarProyectoPage({ params }: PageProps) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(`/ingresar?next=/mis-proyectos/${id}`);

  const project = await getManagedProject(id);
  if (!project) notFound();

  const roles = project.roles ?? [];
  const [catalog, team] = await Promise.all([
    getActiveSkills(),
    getTeamForEvaluation(project.id),
  ]);
  const estado = ESTADO[project.status] ?? {
    label: project.status,
    tone: "neutral" as BadgeTone,
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:py-10">
      <Link
        href="/mis-proyectos"
        className="text-sm text-muted transition-colors hover:text-electric"
      >
        ← Volver a mis proyectos
      </Link>

      <div className="mt-6 rounded-2xl border border-border bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-ink">{project.titulo}</h1>
              <Link
                href={`/mis-proyectos/${project.id}/editar`}
                aria-label="Editar datos del proyecto"
                className="group flex h-7 shrink-0 items-center overflow-hidden rounded-full text-muted transition-colors hover:bg-surface hover:text-electric"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-7 shrink-0 p-1.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
                <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-medium opacity-0 transition-all duration-300 ease-out group-hover:max-w-16 group-hover:pr-3 group-hover:opacity-100">
                  Editar
                </span>
              </Link>
            </div>
            {project.resumen && (
              <p className="text-sm text-muted">{project.resumen}</p>
            )}
          </div>
          <Badge tone={estado.tone} className="shrink-0">
            {estado.label}
          </Badge>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-4">
          <Link
            href={`/mis-proyectos/${project.id}/postulaciones`}
            className={buttonClasses({ variant: "secondary" })}
          >
            Ver postulaciones
          </Link>
          <Link
            href={`/mis-proyectos/${project.id}/seguimiento`}
            className={buttonClasses({ variant: "secondary" })}
          >
            Ver seguimiento de hitos
          </Link>
          {project.status === "activo" && (
            <Link
              href={`/mis-proyectos/${project.id}/validar`}
              className={buttonClasses({ variant: "primary" })}
            >
              Validar y cerrar
            </Link>
          )}
          {project.status === "borrador" && project.comentario_moderacion && (
            <Link
              href={`/mis-proyectos/${project.id}/observaciones`}
              className={buttonClasses({ variant: "danger" })}
            >
              Ver observaciones
            </Link>
          )}
        </div>
      </div>

      {/* Aviso de rechazo del moderador (S-07): solo mientras el proyecto
          sigue en 'borrador' — una vez reenviado (en_revision), el comentario
          y las observaciones se mantienen en la base como contexto para el
          moderador, pero ya no es "algo pendiente" que mostrar acá. */}
      {project.status === "borrador" && project.comentario_moderacion && (
        <Link
          href={`/mis-proyectos/${project.id}/observaciones`}
          className="mt-6 flex flex-col gap-1 rounded-2xl border border-coral/30 bg-coral/5 p-5 transition-colors hover:bg-coral/10"
        >
          <p className="text-sm font-medium text-ink">
            El moderador pidió cambios — ver observaciones y responder
          </p>
          <p className="text-sm text-muted">{project.comentario_moderacion}</p>
        </Link>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="flex flex-col gap-8">
          {/* Roles */}
          <div className="rounded-2xl border border-border bg-white p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-ink">
                Roles ({roles.length})
              </h2>
              <AddRoleModal projectId={project.id} catalog={catalog} />
            </div>

            {roles.length === 0 ? (
              <p className="mt-2 text-sm text-muted">
                Todavía no hay roles. Agrega al menos uno para poder publicar
                el proyecto.
              </p>
            ) : (
              <ul className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4">
                {roles.map((rol) => (
                  <RoleRow
                    key={rol.id}
                    rol={rol}
                    projectId={project.id}
                    catalog={catalog}
                  />
                ))}
              </ul>
            )}
          </div>

          {/* Equipo y evaluación de cada integrante */}
          {team && team.length > 0 && (
            <div className="rounded-2xl border border-border bg-white p-8">
              <h2 className="text-lg font-semibold text-ink">
                Equipo ({team.length})
              </h2>
              <p className="mt-1 text-sm text-muted">
                Evalúa a cada integrante (1–5 y un comentario). La evaluación
                es privada: solo la ve el integrante.
              </p>
              <ul className="mt-5 flex flex-col gap-3">
                {team.map((m) => (
                  <MemberEvaluationForm
                    key={m.userId}
                    member={m}
                    projectId={project.id}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-8">
          {/* Publicación */}
          <div className="rounded-2xl border border-border bg-white p-6">
            <h2 className="text-lg font-semibold text-ink">Publicación</h2>
            <div className="mt-4">
              <PublishControls projectId={project.id} status={project.status} />
            </div>
          </div>

          {/* Zona de eliminación */}
          <DeleteProjectButton projectId={project.id} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function RoleRow({
  rol,
  projectId,
  catalog,
}: {
  rol: ManagedProject["roles"][number];
  projectId: string;
  catalog: Skill[];
}) {
  return (
    <li className="flex flex-col gap-2.5 rounded-xl border border-border bg-white p-7 transition-all hover:border-electric/30 hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink">{rol.nombre}</span>
          <Badge>
            {rol.cupos} {rol.cupos === 1 ? "cupo" : "cupos"}
          </Badge>
        </div>
        <form action={deleteRole}>
          <input type="hidden" name="roleId" value={rol.id} />
          <input type="hidden" name="projectId" value={projectId} />
          <button
            type="submit"
            className={buttonClasses({ variant: "ghost", size: "sm" })}
          >
            Eliminar
          </button>
        </form>
      </div>
      {rol.descripcion && (
        <p className="text-sm text-muted">{rol.descripcion}</p>
      )}
      <RoleSkillsEditor
        projectId={projectId}
        roleId={rol.id}
        skills={rol.skills ?? []}
        catalog={catalog}
      />
    </li>
  );
}
