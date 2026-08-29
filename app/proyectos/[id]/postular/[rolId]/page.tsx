import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getRoleForApplication } from "@/features/projects/queries";
import { getCurrentUser } from "@/features/auth/queries";
import { getMyActiveApplicationInProject } from "@/features/applications/queries";
import { ApplyForm } from "@/features/applications/components/apply-form";

export const metadata: Metadata = {
  title: "Postular · CampusLab",
};

const NIVEL_LABEL: Record<string, string> = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

type PageProps = { params: Promise<{ id: string; rolId: string }> };

/** E-03 · Postulación a un rol. Requiere sesión. */
export default async function PostularPage({ params }: PageProps) {
  const { id, rolId } = await params;

  // Guarda de autenticación: el flujo de postular es solo para usuarios con sesión.
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/ingresar?next=/proyectos/${id}/postular/${rolId}`);
  }

  // Valida que el rol exista, sea de este proyecto y el proyecto esté publicado.
  const rol = await getRoleForApplication(id, rolId);
  if (!rol) notFound();

  // Regla: un rol por proyecto. Si ya hay una postulación activa en este
  // proyecto, se bloquea el formulario (sea a este rol o a otro).
  const miPostulacion = await getMyActiveApplicationInProject(id);
  const esOtroRol = Boolean(miPostulacion) && miPostulacion!.roleId !== rolId;
  const skills = rol.skills ?? [];

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-10">
      <Link
        href={`/proyectos/${id}`}
        className="text-sm text-muted transition-colors hover:text-electric"
      >
        ← Volver al proyecto
      </Link>

      {/* Resumen del rol */}
      <header className="mt-6 flex flex-col gap-2">
        <span className="text-sm text-muted">{rol.project?.titulo}</span>
        <h1 className="text-2xl font-bold text-ink">Postular · {rol.nombre}</h1>
        {rol.descripcion && <p className="text-muted">{rol.descripcion}</p>}
        {skills.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <Badge key={s.skill?.id ?? s.nivel_minimo} tone="outline">
                {s.skill?.nombre}
                {s.nivel_minimo && (
                  <span className="text-muted/70">
                    · {NIVEL_LABEL[s.nivel_minimo] ?? s.nivel_minimo}
                  </span>
                )}
              </Badge>
            ))}
          </div>
        )}
      </header>

      {/* Formulario, o aviso si ya hay una postulación activa en el proyecto:
          a este mismo rol, o a otro (la regla es un rol por proyecto). */}
      <div className="mt-8">
        {miPostulacion ? (
          <div className="rounded-lg border border-border bg-surface/50 p-6 text-center">
            <p className="font-medium text-ink">
              {esOtroRol
                ? "Ya tienes una postulación activa en este proyecto"
                : "Ya postulaste a este rol"}
            </p>
            <p className="mt-1 text-sm text-muted">
              {esOtroRol
                ? `Solo puedes postular a un rol por proyecto (postulaste a "${miPostulacion.roleNombre}").`
                : "Tu postulación está registrada. Te avisaremos si hay novedades."}
            </p>
            <Link
              href={`/proyectos/${id}`}
              className={cn(
                "mt-4 inline-flex",
                buttonClasses({ variant: "secondary", size: "sm" }),
              )}
            >
              Volver al proyecto
            </Link>
          </div>
        ) : (
          <ApplyForm projectId={id} roleId={rolId} />
        )}
      </div>
    </main>
  );
}
