import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { cn } from "@/lib/utils";
import type { ProjectCard as ProjectCardData } from "@/features/projects/queries";

/**
 * Tarjeta de un proyecto en el catálogo público (P-02) y en la landing (P-01).
 * Presentacional: recibe una fila ya consultada y enlaza a su ficha (P-03).
 * Alineada al diseño de Figma: estado, organización verificada, habilidades
 * (máx. 3), meta y CTA.
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

  // Habilidades exigidas, sin repetir; el diseño muestra hasta 3.
  const habilidades = Array.from(
    new Set(
      roles.flatMap((rol) =>
        (rol.skills ?? [])
          .map((s) => s.skill?.nombre)
          .filter((nombre): nombre is string => Boolean(nombre)),
      ),
    ),
  );
  const habilidadesVisibles = habilidades.slice(0, 3);
  const habilidadesRestantes = habilidades.length - habilidadesVisibles.length;

  // Meta: duración y modalidad, separadas por punto medio.
  const meta = [
    project.duracion_semanas ? `${project.duracion_semanas} semanas` : null,
    project.modalidad ? MODALIDAD_LABEL[project.modalidad] ?? project.modalidad : null,
  ].filter(Boolean);

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-border bg-white p-5">
      {/* Estado: los proyectos del catálogo están abiertos. */}
      <div>
        <Badge tone="success">
          Abierto{cuposTotales > 0 && ` · ${cuposTotales} ${cuposTotales === 1 ? "cupo" : "cupos"}`}
        </Badge>
      </div>

      {/* Título */}
      <Link
        href={`/proyectos/${project.id}`}
        className="font-semibold text-ink transition-colors hover:text-electric"
      >
        {project.titulo}
      </Link>

      {/* Organización + verificación */}
      {org?.nombre && (
        <span className="-mt-1 flex items-center gap-1.5 text-sm text-muted">
          {org.nombre}
          {org.verificacion === "verificado" && <VerifiedBadge />}
        </span>
      )}

      {/* Habilidades exigidas (máx. 3) */}
      {habilidadesVisibles.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {habilidadesVisibles.map((nombre) => (
            <Badge key={nombre} tone="neutral">
              {nombre}
            </Badge>
          ))}
          {habilidadesRestantes > 0 && (
            <span className="text-xs text-muted">+{habilidadesRestantes}</span>
          )}
        </div>
      )}

      {/* Meta: duración y modalidad */}
      {meta.length > 0 && (
        <p className="text-xs text-muted">{meta.join(" · ")}</p>
      )}

      {/* CTA */}
      <Link
        href={`/proyectos/${project.id}`}
        className={cn(buttonClasses({ variant: "primary" }), "mt-1 w-full")}
      >
        Ver proyecto →
      </Link>
    </article>
  );
}
