import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ProjectCard as ProjectCardData } from "@/features/projects/queries";

/**
 * Tarjeta de un proyecto en el catálogo público (P-02).
 * Presentacional: recibe una fila ya consultada y enlaza a su ficha (P-03).
 */

// Etiqueta legible para cada modalidad del enum project_modality.
const MODALIDAD_LABEL: Record<string, string> = {
  remoto: "Remoto",
  presencial: "Presencial",
  hibrido: "Híbrido",
};

export function ProjectCard({ project }: { project: ProjectCardData }) {
  const org = project.organization;
  const roles = project.roles ?? [];

  // Cupos totales sumando los de cada rol.
  const cuposTotales = roles.reduce((total, rol) => total + rol.cupos, 0);

  // Habilidades exigidas, sin repetir, para mostrar como chips.
  const habilidades = Array.from(
    new Set(
      roles.flatMap((rol) =>
        (rol.skills ?? [])
          .map((s) => s.skill?.nombre)
          .filter((nombre): nombre is string => Boolean(nombre)),
      ),
    ),
  );
  const habilidadesVisibles = habilidades.slice(0, 4);
  const habilidadesRestantes = habilidades.length - habilidadesVisibles.length;

  return (
    <Link
      href={`/proyectos/${project.id}`}
      className="group flex flex-col gap-4 rounded-lg border border-border bg-white p-5 transition-colors hover:border-electric/40"
    >
      {/* Organización y verificación */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted">{org?.nombre}</span>
        {org?.verificacion === "verificado" && (
          <Badge tone="success">Verificada</Badge>
        )}
      </div>

      {/* Título y resumen */}
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold text-ink group-hover:text-electric">
          {project.titulo}
        </h3>
        {project.resumen && (
          <p className="line-clamp-2 text-sm text-muted">{project.resumen}</p>
        )}
      </div>

      {/* Metadatos: modalidad, duración, cupos */}
      <div className="flex flex-wrap items-center gap-2">
        {project.modalidad && (
          <Badge tone="brand">
            {MODALIDAD_LABEL[project.modalidad] ?? project.modalidad}
          </Badge>
        )}
        {project.duracion_semanas && (
          <Badge>{project.duracion_semanas} semanas</Badge>
        )}
        {cuposTotales > 0 && (
          <Badge>
            {cuposTotales} {cuposTotales === 1 ? "cupo" : "cupos"}
          </Badge>
        )}
      </div>

      {/* Habilidades exigidas */}
      {habilidadesVisibles.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-4">
          {habilidadesVisibles.map((nombre) => (
            <Badge key={nombre} tone="outline">
              {nombre}
            </Badge>
          ))}
          {habilidadesRestantes > 0 && (
            <span className="text-xs text-muted">
              +{habilidadesRestantes}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
