import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { OrgLogo } from "@/components/ui/org-logo";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { cn } from "@/lib/utils";
import type { ProjectCard as ProjectCardData } from "@/features/projects/queries";
import { esAptoSinExperiencia } from "@/features/projects/roles";

/**
 * Tarjeta de un proyecto en el catálogo público (P-02) y en la landing (P-01).
 * Presentacional: recibe una fila ya consultada y enlaza a su ficha (P-03).
 *
 * `variant`:
 * - `catalog` (default): título, org y CTA con enlaces propios (catálogo / grid).
 * - `hero`: toda la tarjeta es un solo enlace al proyecto (sin botón "Ver
 *   proyecto"); pensado para el ancla del hero de la landing.
 *
 * `compact` (solo aplica a `hero`): el mismo marco de `TiltedProjectCard` se
 * usa a dos tamaños — el hero de la landing (~376px de alto) y el panel de
 * auth (`compact`, 300px). Sin este ajuste, el padding y el resumen a 4
 * líneas pensados para el marco grande se salían del marco chico: el badge
 * "Apto sin experiencia" quedaba cortado, y variaba según cuánto resumen
 * tuviera cada proyecto.
 *
 * En catálogo no reservamos min-h por bloque: en un grid con `h-full` eso
 * sumaba huecos raros (sobre todo entre meta y “Apto…”). La altura estable
 * del hero/tilt vive en `TiltedProjectCard`, no acá. Solo en hero se
 * muestra el `resumen` (2–3 líneas, 2 en `compact`) para llenar el marco sin
 * vaciar el catálogo.
 */

const MODALIDAD_LABEL: Record<string, string> = {
  remoto: "Remoto",
  presencial: "Presencial",
  hibrido: "Híbrido",
};

export function ProjectCard({
  project,
  variant = "catalog",
  compact = false,
  className,
}: {
  project: ProjectCardData;
  variant?: "catalog" | "hero";
  /** Solo con `variant="hero"`: para el marco chico de `TiltedProjectCard`. */
  compact?: boolean;
  className?: string;
}) {
  const org = project.organization;
  const roles = project.roles ?? [];

  const cuposTotales = roles.reduce(
    (total, rol) => total + Math.max(0, rol.cupos - rol.aceptadas),
    0,
  );

  const aptoSinExperiencia = roles.some((rol) =>
    esAptoSinExperiencia(rol.skills ?? []),
  );

  const habilidades = Array.from(
    new Set(
      roles.flatMap((rol) =>
        (rol.skills ?? [])
          .map((s) => s.skill?.nombre)
          .filter((nombre): nombre is string => Boolean(nombre)),
      ),
    ),
  );
  const habilidadesVisibles = habilidades.slice(0, 2);
  const habilidadesRestantes = habilidades.length - habilidadesVisibles.length;

  const meta = [
    project.duracion_semanas ? `${project.duracion_semanas} semanas` : null,
    project.modalidad
      ? (MODALIDAD_LABEL[project.modalidad] ?? project.modalidad)
      : null,
  ].filter(Boolean);

  const orgBlock =
    org?.nombre &&
    (variant === "hero" ? (
      <div className="flex w-fit max-w-full items-center gap-2">
        <OrgLogo logoUrl={org.logo_url} nombre={org.nombre} size="sm" />
        <span className="flex min-w-0 items-center gap-1.5 text-sm text-muted">
          <span className="truncate">{org.nombre}</span>
          {org.verificacion === "verificado" && <VerifiedBadge />}
        </span>
      </div>
    ) : (
      <Link
        href={`/organizaciones/${org.id}`}
        className="group/org flex w-fit max-w-full items-center gap-2"
      >
        <OrgLogo logoUrl={org.logo_url} nombre={org.nombre} size="sm" />
        <span className="flex min-w-0 items-center gap-1.5 text-sm text-muted group-hover/org:text-electric">
          <span className="truncate">{org.nombre}</span>
          {org.verificacion === "verificado" && <VerifiedBadge />}
        </span>
      </Link>
    ));

  const skillsBlock =
    habilidadesVisibles.length > 0 ? (
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
    ) : null;

  const metaBlock =
    meta.length > 0 ? (
      <p className="text-xs text-muted">{meta.join(" · ")}</p>
    ) : null;

  const aptoBlock = aptoSinExperiencia ? (
    <span className="inline-flex w-fit items-center rounded-full bg-sprout/15 px-2.5 py-0.5 text-xs font-medium text-sprout">
      Apto sin experiencia
    </span>
  ) : null;

  const body = (
    <>
      <div className="flex flex-col gap-2.5">
        <div>
          <Badge tone="success">
            Abierto
            {cuposTotales > 0 &&
              ` · ${cuposTotales} ${cuposTotales === 1 ? "cupo" : "cupos"}`}
          </Badge>
        </div>

        {variant === "hero" ? (
          <p className="line-clamp-2 text-lg font-semibold leading-snug text-ink transition-colors group-hover:text-electric">
            {project.titulo}
          </p>
        ) : (
          <Link
            href={`/proyectos/${project.id}`}
            className="line-clamp-2 font-semibold leading-snug text-ink transition-colors hover:text-electric"
          >
            {project.titulo}
          </Link>
        )}

        {orgBlock}
        {skillsBlock}

        {variant === "hero" && project.resumen ? (
          <p
            className={cn(
              "text-sm leading-relaxed text-muted",
              compact ? "line-clamp-2" : "line-clamp-4",
            )}
          >
            {project.resumen}
          </p>
        ) : null}

        {/* En catálogo meta/apto van con el bloque de arriba (sin huecos). */}
        {variant === "catalog" ? (
          <>
            {metaBlock}
            {aptoBlock}
          </>
        ) : null}
      </div>

      {/* En hero, meta/apto abajo del marco fijo para no dejar un vacío muerto. */}
      {variant === "hero" ? (
        <div
          className={cn(
            "mt-auto flex flex-col",
            compact ? "gap-1.5 pt-1" : "gap-2.5 pt-2",
          )}
        >
          {metaBlock}
          {aptoBlock}
        </div>
      ) : null}

      {variant === "catalog" ? (
        <Link
          href={`/proyectos/${project.id}`}
          className={cn(
            buttonClasses({ variant: "primary" }),
            "group mt-auto inline-flex w-full items-center justify-center gap-1",
          )}
        >
          Ver proyecto
          <span
            aria-hidden
            className="transition-transform group-hover:translate-x-0.5"
          >
            →
          </span>
        </Link>
      ) : null}
    </>
  );

  if (variant === "hero") {
    return (
      <Link
        href={`/proyectos/${project.id}`}
        className={cn(
          "group flex h-full flex-col rounded-lg border border-border bg-white transition-colors hover:border-electric/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40",
          compact ? "gap-2 p-4" : "gap-3 p-6",
          className,
        )}
      >
        {body}
      </Link>
    );
  }

  return (
    <article
      className={cn(
        "flex h-full flex-col gap-4 rounded-lg border border-border bg-white p-5",
        className,
      )}
    >
      {body}
    </article>
  );
}
