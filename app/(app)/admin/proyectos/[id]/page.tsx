import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/features/auth/queries";
import {
  getProjectDetailForAdmin,
  MODALIDAD_LABEL,
} from "@/features/admin/queries";
import { CancelProjectButton } from "@/features/projects/components/cancel-project-button";

export const metadata: Metadata = {
  title: "Detalle del proyecto · CampusLab",
};

const NIVEL_LABEL: Record<string, string> = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

const FORMATO_FECHA = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

type PageProps = { params: Promise<{ id: string }> };

/**
 * Detalle de un proyecto, solo lectura, para el admin (D-01). Muestra el
 * proyecto completo (no un resumen): todo lo que el gestor cargó, el ciclo
 * de moderación si lo tuvo, cada rol con sus habilidades, y el equipo con el
 * rol que cubre cada integrante — para que el admin pueda decidir (p. ej.
 * cancelar) con el mismo contexto que tiene el gestor, no menos. Reusa
 * `CancelProjectButton` (M60) tal cual: la Server Action detrás no depende
 * de que el actor gestione la organización dueña, solo de la RLS/el trigger
 * `projects_guard_status`, que ya distinguen entre gestor y admin.
 */
export default async function AdminProyectoDetallePage({ params }: PageProps) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");
  if (!user.esAdmin) redirect("/");

  const project = await getProjectDetailForAdmin(id);
  if (!project) notFound();

  const puedeCancelar = project.status !== "completado" && project.status !== "cancelado";
  const roles = project.roles ?? [];
  // La ficha pública (`/proyectos/[id]`) solo existe para estos dos estados
  // (`getPublishedProjectById` filtra por status, no solo la RLS) — en
  // cualquier otro estado el link daría 404 aunque el admin sí puede ver el
  // proyecto acá.
  const tieneFichaPublica = project.status === "publicado" || project.status === "seleccion";

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-12">
      <Link
        href="/admin/proyectos"
        className="text-sm font-medium text-muted hover:text-ink"
      >
        ← Volver a proyectos
      </Link>

      {/* Identidad + resumen */}
      <div className="mt-4 rounded-2xl border border-border bg-white p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {project.titulo}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {project.org?.nombre ?? "(sin organización)"}
              {project.creadoPorNombre && ` · A cargo de ${project.creadoPorNombre}`}
            </p>
          </div>
          <Badge tone={puedeCancelar ? "brand" : "danger"}>{project.etiquetaEstado}</Badge>
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          {tieneFichaPublica ? (
            <a
              href={`/proyectos/${project.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-electric hover:underline"
            >
              Ver página pública del proyecto ↗
            </a>
          ) : (
            <p className="text-sm text-muted" title="Solo existe para proyectos publicados o en selección">
              Sin página pública en este estado
            </p>
          )}
          {project.org && (
            <a
              href={`/organizaciones/${project.org.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-electric hover:underline"
            >
              Ver organización ↗
            </a>
          )}
        </div>

        {project.resumen && <p className="mt-5 text-sm text-ink">{project.resumen}</p>}

        <dl className="mt-6 grid grid-cols-2 gap-5 border-t border-border pt-5 sm:grid-cols-4">
          <Campo label="Modalidad">
            {project.modalidad ? (MODALIDAD_LABEL[project.modalidad] ?? project.modalidad) : "—"}
          </Campo>
          <Campo label="Duración">
            {project.duracion_semanas ? `${project.duracion_semanas} semanas` : "—"}
          </Campo>
          <Campo label="Dedicación semanal">{project.dedicacion_semanal || "—"}</Campo>
          <Campo label="Roles">{roles.length}</Campo>
        </dl>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
        {/* Columna principal: el contenido con el que el admin necesita más
            espacio para leer — el brief completo y cada rol con sus
            habilidades. */}
        <div className="flex flex-col gap-5">
          {(project.problema || project.alcance || project.entregable || project.expectativas) && (
            <div className="rounded-2xl border border-border bg-white p-7">
              <h2 className="font-semibold text-ink">Brief del proyecto</h2>
              <div className="mt-4 flex flex-col gap-5">
                <Bloque titulo="El desafío" texto={project.problema} />
                <Bloque titulo="Alcance" texto={project.alcance} />
                <Bloque titulo="Entregable" texto={project.entregable} />
                <Bloque titulo="Expectativas" texto={project.expectativas} />
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-white p-7">
            <h2 className="font-semibold text-ink">Roles ({roles.length})</h2>
            {roles.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Todavía no tiene roles definidos.</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-4">
                {roles.map((r) => (
                  <li key={r.id} className="rounded-lg border border-border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-ink">{r.nombre}</p>
                      <p className="text-xs text-muted">
                        {r.cupos} {r.cupos === 1 ? "cupo" : "cupos"}
                        {r.horas_semanales ? ` · ~${r.horas_semanales} h/semana` : ""}
                      </p>
                    </div>
                    {r.descripcion && <p className="mt-1.5 text-sm text-muted">{r.descripcion}</p>}
                    {r.skills.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {r.skills.map((s, i) => (
                          <Badge key={i} tone="outline">
                            {s.skill?.nombre ?? "—"}
                            {s.nivel_minimo ? ` · ${NIVEL_LABEL[s.nivel_minimo] ?? s.nivel_minimo}` : ""}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Columna angosta: equipo, ciclo de moderación, metadatos y la
            acción de cancelar — datos de contexto y de gestión, no lo primero
            que el admin necesita leer con detalle. */}
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-border bg-white p-7">
            <h2 className="font-semibold text-ink">Equipo ({project.integrantes.length})</h2>
            {project.integrantes.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Todavía no tiene equipo formado.</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-4">
                {project.integrantes.map((i) => (
                  <li key={i.id} className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-electric text-xs font-semibold text-white">
                      {i.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={i.avatarUrl}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="size-9 object-cover"
                        />
                      ) : (
                        iniciales(i.nombre)
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{i.nombre}</p>
                      {i.rol && <p className="truncate text-xs text-muted">{i.rol}</p>}
                    </div>
                    <a
                      href={`/u/${i.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-muted transition-colors hover:text-electric"
                      title="Ver perfil"
                      aria-label={`Ver perfil de ${i.nombre}`}
                    >
                      <IconPerfil className="size-4" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {(project.comentario_moderacion || project.respuesta_patrocinador) && (
            <div className="rounded-2xl border border-border bg-white p-7">
              <h2 className="font-semibold text-ink">Moderación</h2>
              <div className="mt-4 flex flex-col gap-4">
                <Bloque titulo="Comentario del moderador" texto={project.comentario_moderacion} />
                <Bloque titulo="Respuesta del patrocinador" texto={project.respuesta_patrocinador} />
              </div>
            </div>
          )}

          {/* Campos que existen en el esquema pero hoy ningún formulario de la
              app llena (fecha_inicio/fecha_fin/descripcion) se muestran igual,
              en "—", para no ocultar que existen. */}
          <div className="rounded-2xl border border-border bg-white p-7">
            <h2 className="font-semibold text-ink">Metadatos</h2>
            <dl className="mt-4 grid grid-cols-2 gap-5">
              <Campo label="Creado">{FORMATO_FECHA.format(new Date(project.created_at))}</Campo>
              <Campo label="Revisado">
                {project.revisado_at ? FORMATO_FECHA.format(new Date(project.revisado_at)) : "—"}
              </Campo>
              <Campo label="Fecha de inicio">
                {project.fecha_inicio ? FORMATO_FECHA.format(new Date(project.fecha_inicio)) : "—"}
              </Campo>
              <Campo label="Fecha de fin">
                {project.fecha_fin ? FORMATO_FECHA.format(new Date(project.fecha_fin)) : "—"}
              </Campo>
              <Campo label="Descripción">{project.descripcion || "—"}</Campo>
            </dl>
          </div>

          {puedeCancelar && <CancelProjectButton projectId={project.id} />}
        </div>
      </div>
    </div>
  );
}

// Iniciales para el avatar cuando no hay foto: mismo criterio que `/u/[id]`.
function iniciales(nombre: string | null): string {
  const partes = (nombre ?? "").trim().split(/\s+/).slice(0, 2);
  return partes.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

/** Ícono de enlace externo, para ir al perfil público de un integrante. */
function IconPerfil({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{children}</dd>
    </div>
  );
}

function Bloque({ titulo, texto }: { titulo: string; texto: string | null }) {
  if (!texto) return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{titulo}</p>
      <p className="mt-1.5 text-sm whitespace-pre-line text-ink">{texto}</p>
    </div>
  );
}
