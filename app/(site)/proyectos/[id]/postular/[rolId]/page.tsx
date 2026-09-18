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
  title: "Postular · Vardelab",
};

const NIVEL_LABEL: Record<string, string> = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

const MODALIDAD_LABEL: Record<string, string> = {
  remoto: "Remoto",
  hibrido: "Híbrido",
  presencial: "Presencial",
};

type PageProps = {
  params: Promise<{ id: string; rolId: string }>;
};

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
  // Rol ya cubierto (M72): puede pasar si el estudiante guardó el enlace o
  // volvió atrás justo cuando el gestor aceptó al último cupo. La guarda real
  // vive en la RLS de `applications_insert_own` — esto solo evita mostrar un
  // formulario que la base de todas formas va a rechazar.
  const rolLleno = !miPostulacion && rol.cupos - rol.aceptadas <= 0;

  const modalidad = rol.project?.modalidad
    ? MODALIDAD_LABEL[rol.project.modalidad] ?? rol.project.modalidad
    : null;
  const duracion = rol.project?.duracion_semanas
    ? `${rol.project.duracion_semanas} ${rol.project.duracion_semanas === 1 ? "semana" : "semanas"}`
    : null;
  const cuposRestantes = Math.max(rol.cupos - rol.aceptadas, 0);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 lg:py-14">
      <Link
        href={`/proyectos/${id}`}
        className="inline-flex items-center text-sm text-muted transition-colors hover:text-electric"
      >
        ← Volver al proyecto
      </Link>

      <header className="mt-8 max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={rolLleno ? "neutral" : "brand"}>
            {rolLleno ? "Cupos llenos" : "Postulación abierta"}
          </Badge>
          <span className="min-w-0 break-words text-sm text-muted">{rol.project?.titulo}</span>
        </div>
        <h1 className="mt-4 break-words text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Postular al rol de {rol.nombre}
        </h1>
        {rol.descripcion && (
          <p className="mt-3 max-w-2xl break-words text-base leading-relaxed text-muted sm:text-lg">
            {rol.descripcion}
          </p>
        )}
      </header>

      {/* Formulario, o aviso si ya hay una postulación activa en el proyecto:
          a este mismo rol, o a otro (la regla es un rol por proyecto). */}
      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start lg:gap-8">
        <section className="min-w-0 rounded-2xl border border-border bg-white p-6 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.28)] sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4 border-b border-border pb-5">
            <div>
              <p className="text-sm font-semibold text-ink">Tu postulación</p>
              <p className="mt-1 text-sm text-muted">
                Cuéntanos cómo podrías aportar a este desafío.
              </p>
            </div>
            {!miPostulacion && !rolLleno && (
              <span className="shrink-0 text-right text-xs text-muted">
                <strong className="block text-sm text-electric">{cuposRestantes}</strong>
                {cuposRestantes === 1 ? "cupo disponible" : "cupos disponibles"}
              </span>
            )}
          </div>

        {miPostulacion ? (
          <div className="rounded-xl border border-border bg-surface/50 p-6 text-center">
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
        ) : rolLleno ? (
          <div className="rounded-xl border border-border bg-surface/50 p-6 text-center">
            <p className="font-medium text-ink">Ya se cubrieron los cupos de este rol</p>
            <p className="mt-1 text-sm text-muted">
              Alguien más fue aceptado mientras tanto. Puede que otro rol de este
              proyecto siga disponible.
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
        </section>

        <aside className="min-w-0 flex flex-col gap-5">
          <section className="min-w-0 rounded-2xl border border-border bg-surface/60 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              El proyecto
            </p>
            <h2 className="mt-3 break-words text-lg font-semibold leading-snug text-ink">
              {rol.project?.titulo}
            </h2>
            {rol.project?.resumen && (
              <p className="mt-2 break-words text-sm leading-relaxed text-muted">
                {rol.project.resumen}
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              {modalidad && <Badge tone="outline">{modalidad}</Badge>}
              {duracion && <Badge tone="outline">{duracion}</Badge>}
            </div>
          </section>

          {skills.length > 0 && (
            <section className="min-w-0 rounded-2xl border border-border bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Lo que se busca
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <Badge
                    key={s.skill?.id ?? s.nivel_minimo}
                    tone="outline"
                    className="max-w-full whitespace-normal break-words text-left"
                  >
                    {s.skill?.nombre}
                    {s.nivel_minimo && (
                      <span className="text-muted/70">
                        · {NIVEL_LABEL[s.nivel_minimo] ?? s.nivel_minimo}
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}
