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
import { getActiveSkills, type Skill } from "@/features/skills/queries";

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
  const catalog = await getActiveSkills();
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
          <Link
            href={`/mis-proyectos/${project.id}/editar`}
            className="mt-1 w-fit text-sm text-electric hover:underline"
          >
            Editar datos del proyecto
          </Link>
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

      {/* Publicación */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-ink">Publicación</h2>
        <div className="mt-3">
          <PublishControls projectId={project.id} status={project.status} />
        </div>
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
