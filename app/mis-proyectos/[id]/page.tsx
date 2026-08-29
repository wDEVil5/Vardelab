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
import { AddRoleForm } from "@/features/projects/components/add-role-form";
import { RoleSkillsEditor } from "@/features/projects/components/role-skills-editor";
import { PublishControls } from "@/features/projects/components/publish-controls";
import { DeleteProjectButton } from "@/features/projects/components/delete-project-button";
import { getActiveSkills, type Skill } from "@/features/skills/queries";
import { getProjectTeam } from "@/features/teams/queries";
import {
  getMilestonesWithSubmissions,
  type MilestoneWithSubmissions,
} from "@/features/milestones/queries";
import {
  approveMilestone,
  returnMilestone,
  deleteMilestone,
} from "@/features/milestones/actions";
import { AddMilestoneForm } from "@/features/milestones/components/add-milestone-form";

export const metadata: Metadata = {
  title: "Gestionar proyecto · CampusLab",
};

const ESTADO: Record<string, { label: string; tone: BadgeTone }> = {
  borrador: { label: "Borrador", tone: "neutral" },
  en_revision: { label: "En revisión", tone: "brand" },
  publicado: { label: "Publicado", tone: "success" },
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
  const [catalog, team, milestones] = await Promise.all([
    getActiveSkills(),
    getProjectTeam(project.id),
    getMilestonesWithSubmissions(project.id),
  ]);
  const estado = ESTADO[project.status] ?? {
    label: project.status,
    tone: "neutral" as BadgeTone,
  };

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link
        href="/mis-proyectos"
        className="text-sm text-muted transition-colors hover:text-electric"
      >
        ← Volver a mis proyectos
      </Link>

      <header className="mt-6 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-ink">{project.titulo}</h1>
          {project.resumen && (
            <p className="text-sm text-muted">{project.resumen}</p>
          )}
          <div className="mt-1 flex gap-4">
            <Link
              href={`/mis-proyectos/${project.id}/editar`}
              className="text-sm text-electric hover:underline"
            >
              Editar datos
            </Link>
            <Link
              href={`/mis-proyectos/${project.id}/postulaciones`}
              className="text-sm text-electric hover:underline"
            >
              Ver postulaciones
            </Link>
          </div>
        </div>
        <Badge tone={estado.tone}>{estado.label}</Badge>
      </header>

      {/* Roles */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-ink">
          Roles ({roles.length})
        </h2>

        {roles.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Todavía no hay roles. Agrega al menos uno para poder publicar el
            proyecto.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
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
      </section>

      {/* Alta de rol */}
      <div className="mt-6">
        <AddRoleForm projectId={project.id} />
      </div>

      {/* Equipo */}
      {team && team.members.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-ink">
            Equipo ({team.members.length})
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {team.members.map((m) => (
              <li
                key={m.userId}
                className="flex items-center justify-between gap-4 rounded-lg border border-border bg-white p-4"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-ink">
                    {m.nombre}
                  </span>
                  {m.carrera && (
                    <span className="text-xs text-muted">{m.carrera}</span>
                  )}
                </div>
                {m.rol && <Badge tone="brand">{m.rol}</Badge>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Hitos */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-ink">
          Hitos ({milestones.length})
        </h2>
        {milestones.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Define los hitos del proyecto: el plan de trabajo por etapas.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {milestones.map((hito) => (
              <MilestoneRow key={hito.id} hito={hito} projectId={project.id} />
            ))}
          </ul>
        )}
        <div className="mt-4">
          <AddMilestoneForm projectId={project.id} />
        </div>
      </section>

      {/* Publicación */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-ink">Publicación</h2>
        <div className="mt-3">
          <PublishControls projectId={project.id} status={project.status} />
        </div>
      </section>

      {/* Zona de eliminación */}
      <section className="mt-10">
        <DeleteProjectButton projectId={project.id} />
      </section>
    </main>
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
    <li className="flex items-start justify-between gap-4 rounded-lg border border-border bg-white p-5">
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink">{rol.nombre}</span>
          <Badge>
            {rol.cupos} {rol.cupos === 1 ? "cupo" : "cupos"}
          </Badge>
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
    </li>
  );
}

// Estado del hito → etiqueta y tono.
const ESTADO_HITO: Record<string, { label: string; tone: BadgeTone }> = {
  pendiente: { label: "Pendiente", tone: "neutral" },
  en_progreso: { label: "En progreso", tone: "brand" },
  entregado: { label: "Entregado", tone: "brand" },
  aprobado: { label: "Aprobado", tone: "success" },
};

function MilestoneRow({
  hito,
  projectId,
}: {
  hito: MilestoneWithSubmissions;
  projectId: string;
}) {
  const estado = ESTADO_HITO[hito.estado] ?? {
    label: hito.estado,
    tone: "neutral" as BadgeTone,
  };
  const entregas = hito.submissions ?? [];
  // Solo se revisa lo que el equipo entregó; un hito ya aprobado no se reabre.
  const enRevision = hito.estado === "entregado";

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="font-medium text-ink">{hito.titulo}</span>
            <Badge tone={estado.tone}>{estado.label}</Badge>
          </div>
          {hito.descripcion && (
            <p className="text-sm text-muted">{hito.descripcion}</p>
          )}
          {hito.fecha_limite && (
            <span className="text-xs text-muted">
              Fecha límite: {hito.fecha_limite}
            </span>
          )}
        </div>

        <form action={deleteMilestone}>
          <input type="hidden" name="milestoneId" value={hito.id} />
          <input type="hidden" name="projectId" value={projectId} />
          <button
            type="submit"
            className={buttonClasses({ variant: "ghost", size: "sm" })}
          >
            Eliminar
          </button>
        </form>
      </div>

      {/* Entregas del equipo (lo que se revisa). */}
      {entregas.length > 0 && (
        <ul className="flex flex-col gap-2 border-t border-border pt-3">
          {entregas.map((s) => (
            <li key={s.id} className="rounded-md bg-surface/60 p-3">
              {s.url && (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-electric hover:underline"
                >
                  {s.url}
                </a>
              )}
              {s.nota && <p className="text-xs text-muted">{s.nota}</p>}
            </li>
          ))}
        </ul>
      )}

      {/* Revisión: aprobar o pedir cambios. Solo con el hito entregado. */}
      {enRevision && (
        <div className="flex items-center gap-2 border-t border-border pt-3">
          <form action={approveMilestone}>
            <input type="hidden" name="milestoneId" value={hito.id} />
            <input type="hidden" name="projectId" value={projectId} />
            <button
              type="submit"
              className={buttonClasses({ variant: "primary", size: "sm" })}
            >
              Aprobar
            </button>
          </form>
          <form action={returnMilestone}>
            <input type="hidden" name="milestoneId" value={hito.id} />
            <input type="hidden" name="projectId" value={projectId} />
            <button
              type="submit"
              className={buttonClasses({ variant: "secondary", size: "sm" })}
            >
              Pedir cambios
            </button>
          </form>
        </div>
      )}
    </li>
  );
}
