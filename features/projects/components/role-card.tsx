"use client";

import { useState, type KeyboardEvent, type MouseEvent } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { esAptoSinExperiencia } from "@/features/projects/roles";
import type { MyProjectApplication } from "@/features/applications/queries";
import type { ProjectDetail } from "@/features/projects/queries";

const NIVEL_LABEL: Record<string, string> = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

const ESTADO_ROL: Record<string, string> = {
  enviada: "Ya postulaste a este rol",
  aceptada: "Aceptado en este rol",
};

const SKILLS_VISIBLES = 2;

type Role = ProjectDetail["roles"][number];

/**
 * Tarjeta de rol en la ficha pública (lista vertical).
 * Clic abre el detalle en modal; Postular no dispara el modal.
 */
export function RoleCard({
  rol,
  projectId,
  miPostulacion,
}: {
  rol: Role;
  projectId: string;
  miPostulacion: MyProjectApplication | null;
}) {
  const [open, setOpen] = useState(false);
  const skills = rol.skills ?? [];
  const skillsVisibles = skills.slice(0, SKILLS_VISIBLES);
  const skillsRestantes = skills.length - skillsVisibles.length;
  const esMiRol = miPostulacion?.roleId === rol.id;
  const tieneOtra = Boolean(miPostulacion) && !esMiRol;
  const cuposRestantesRol = rol.cupos - rol.aceptadas;
  const rolLleno = cuposRestantesRol <= 0;
  const horas =
    rol.horas_semanales != null ? `~${rol.horas_semanales} h/semana` : null;
  const apto = esAptoSinExperiencia(skills);
  const postularHref = `/proyectos/${projectId}/postular/${rol.id}`;

  function abrir() {
    setOpen(true);
  }

  function onCardKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      abrir();
    }
  }

  function stopCardOpen(e: MouseEvent) {
    e.stopPropagation();
  }

  const cuposLabel = rolLleno
    ? "Lleno"
    : `${cuposRestantesRol} ${cuposRestantesRol === 1 ? "cupo" : "cupos"}`;

  return (
    <>
      <article
        role="button"
        tabIndex={0}
        aria-label={`Ver detalle del rol ${rol.nombre}`}
        onClick={abrir}
        onKeyDown={onCardKeyDown}
        className="flex h-full min-h-56 cursor-pointer flex-col gap-3 rounded-2xl border border-border bg-white p-4 text-left transition-colors hover:border-electric/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric lg:min-h-0 lg:gap-2.5 lg:rounded-lg lg:p-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-base font-semibold leading-snug text-ink lg:text-sm">
              {rol.nombre}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted lg:mt-1">
              <span
                className={cn(
                  "font-medium",
                  rolLleno ? "text-muted" : "text-electric",
                )}
              >
                {cuposLabel}
              </span>
              {horas && (
                <>
                  <span aria-hidden>·</span>
                  <span>{horas}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {apto && (
          <span className="inline-flex w-fit max-w-full items-center rounded-full bg-sprout/15 px-2.5 py-0.5 text-[11px] font-medium text-sprout sm:text-xs">
            Apto sin experiencia
          </span>
        )}

        {rol.descripcion && (
          <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-muted lg:text-xs">
            {rol.descripcion}
          </p>
        )}

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skillsVisibles.map((s) => {
              const nombre = s.skill?.nombre ?? "";
              const nivel = s.nivel_minimo
                ? (NIVEL_LABEL[s.nivel_minimo] ?? s.nivel_minimo)
                : null;
              const label = nivel ? `${nombre} · ${nivel}` : nombre;
              return (
                <Badge
                  key={s.skill?.id ?? s.nivel_minimo}
                  tone="outline"
                  title={label}
                >
                  {nombre}
                  {nivel && (
                    <span className="text-muted/70"> · {nivel}</span>
                  )}
                </Badge>
              );
            })}
            {skillsRestantes > 0 && (
              <Badge tone="outline" className="tabular-nums">
                +{skillsRestantes}
              </Badge>
            )}
          </div>
        )}

        {!rolLleno && (
          <div
            className="mt-auto flex flex-wrap items-center gap-3 border-t border-border pt-3"
            onClick={stopCardOpen}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <RoleCta
              esMiRol={esMiRol}
              tieneOtra={tieneOtra}
              rolLleno={rolLleno}
              status={miPostulacion?.status}
              postularHref={postularHref}
            />
          </div>
        )}
      </article>

      <Modal open={open} onClose={() => setOpen(false)} title={rol.nombre}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={rolLleno ? "neutral" : "brand"}>
              {rolLleno
                ? "Cupos llenos"
                : `${cuposRestantesRol} ${cuposRestantesRol === 1 ? "cupo" : "cupos"}`}
            </Badge>
            {horas && <Badge tone="neutral">{horas}</Badge>}
            {apto && (
              <span className="inline-flex items-center rounded-full bg-sprout/15 px-2.5 py-0.5 text-xs font-medium text-sprout">
                Apto sin experiencia
              </span>
            )}
          </div>

          {rol.descripcion && (
            <div>
              <h3 className="text-sm font-semibold text-ink">Descripción</h3>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted">
                {rol.descripcion}
              </p>
            </div>
          )}

          {skills.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-ink">Habilidades</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {skills.map((s) => {
                  const nombre = s.skill?.nombre ?? "";
                  const nivel = s.nivel_minimo
                    ? (NIVEL_LABEL[s.nivel_minimo] ?? s.nivel_minimo)
                    : null;
                  return (
                    <Badge
                      key={s.skill?.id ?? `${nombre}-${s.nivel_minimo}`}
                      tone="outline"
                    >
                      {nombre}
                      {nivel && (
                        <span className="text-muted/70"> · {nivel}</span>
                      )}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-t border-border pt-4">
            <RoleCta
              esMiRol={esMiRol}
              tieneOtra={tieneOtra}
              rolLleno={rolLleno}
              status={miPostulacion?.status}
              postularHref={postularHref}
              fullWidth
            />
          </div>
        </div>
      </Modal>
    </>
  );
}

function RoleCta({
  esMiRol,
  tieneOtra,
  rolLleno,
  status,
  postularHref,
  fullWidth,
}: {
  esMiRol: boolean;
  tieneOtra: boolean;
  rolLleno: boolean;
  status: string | undefined;
  postularHref: string;
  fullWidth?: boolean;
}) {
  if (esMiRol) {
    return (
      <Badge tone="success" className="max-w-full truncate">
        {ESTADO_ROL[status ?? ""] ?? "Ya postulaste a este rol"}
      </Badge>
    );
  }
  if (tieneOtra) {
    return (
      <p className="line-clamp-2 text-xs text-muted sm:text-sm">
        Ya tienes una postulación activa en este proyecto.
      </p>
    );
  }
  if (rolLleno) {
    return (
      <p className="text-xs text-muted sm:text-sm">
        Cupos cubiertos en este rol.
      </p>
    );
  }
  return (
    <Link
      href={postularHref}
      className={cn(
        buttonClasses({ variant: "primary", size: "sm" }),
        fullWidth && "w-full",
      )}
    >
      Postular
    </Link>
  );
}
