import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";
import { getEditableProject } from "@/features/projects/queries";
import { updateProject } from "@/features/projects/actions";
import { ProjectForm } from "@/features/projects/components/project-form";

export const metadata: Metadata = {
  title: "Editar proyecto · CampusLab",
};

type PageProps = { params: Promise<{ id: string }> };

/** Edición de la plantilla de un proyecto propio. Requiere sesión de patrocinador dueño. */
export default async function EditarProyectoPage({ params }: PageProps) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(`/ingresar?next=/mis-proyectos/${id}/editar`);
  if (!user.esPatrocinador) redirect("/proyectos");

  const project = await getEditableProject(id);
  if (!project) notFound();

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-10">
      <Link
        href={`/mis-proyectos/${id}`}
        className="text-sm text-muted transition-colors hover:text-electric"
      >
        ← Volver al proyecto
      </Link>

      <header className="mt-6 flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink">Editar proyecto</h1>
        <p className="text-sm text-muted">
          Los roles y la publicación se gestionan desde la página del proyecto.
        </p>
      </header>

      <div className="mt-8">
        <ProjectForm
          action={updateProject}
          submitLabel="Guardar cambios"
          pendingText="Guardando…"
          project={project}
        />
      </div>
    </main>
  );
}
