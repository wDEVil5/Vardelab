"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { OrgLogo } from "@/components/ui/org-logo";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";
import { withdrawApplication } from "@/features/applications/actions";
import type { MyApplication } from "@/features/applications/queries";

// Estado de la postulación → etiqueta y tono del badge.
const ESTADO: Record<string, { label: string; tone: BadgeTone }> = {
  enviada: { label: "En revisión", tone: "brand" },
  aceptada: { label: "Aceptada", tone: "success" },
  rechazada: { label: "Rechazada", tone: "danger" },
  retirada: { label: "Retirada", tone: "neutral" },
  removida: { label: "Ya no en el equipo", tone: "neutral" },
};

type FiltroId = "todas" | "enviada" | "aceptada" | "cerradas";

const FILTROS: { id: FiltroId; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "enviada", label: "En revisión" },
  { id: "aceptada", label: "Aceptadas" },
  { id: "cerradas", label: "Cerradas" },
];

/** Ícono de flecha, para el acceso directo a un proyecto ya aceptado. */
function IconFlecha({ className }: { className?: string }) {
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
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function coincide(status: string, filtro: FiltroId): boolean {
  if (filtro === "todas") return true;
  if (filtro === "cerradas") {
    return status === "rechazada" || status === "retirada" || status === "removida";
  }
  return status === filtro;
}

// Fecha de postulación en términos relativos y sin ambigüedad.
function haceCuanto(iso: string): string {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dias <= 0) return "Hoy";
  if (dias === 1) return "Ayer";
  if (dias < 7) return `Hace ${dias} días`;
  if (dias < 30) return `Hace ${Math.floor(dias / 7)} sem`;
  const meses = Math.floor(dias / 30);
  return meses <= 1 ? "Hace 1 mes" : `Hace ${meses} meses`;
}

/**
 * Tabla del embudo de postulaciones (S-04): filtro por estado y una fila por
 * postulación (proyecto, rol, estado y fecha). Es solo seguimiento del embudo;
 * el trabajo del proyecto (hitos y entregas) vive en "En curso".
 */
export function ApplicationsTable({ apps }: { apps: MyApplication[] }) {
  const [filtro, setFiltro] = useState<FiltroId>("todas");
  const visibles = apps.filter((a) => coincide(a.status, filtro));

  const conteo = (f: FiltroId) =>
    apps.filter((a) => coincide(a.status, f)).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Filtros: control segmentado con contadores. */}
      <div
        role="group"
        aria-label="Filtrar por estado"
        className="inline-flex flex-wrap gap-1 self-start rounded-full bg-surface p-1"
      >
        {FILTROS.map((f) => {
          const activo = filtro === f.id;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={activo}
              onClick={() => setFiltro(f.id)}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                activo ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink",
              )}
            >
              {f.label}
              <span className="text-xs tabular-nums text-muted/70">
                {conteo(f.id)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        {/* Cabecera (solo desktop). Alineada con las columnas de cada fila. */}
        <div className="hidden items-center gap-4 border-b border-border bg-surface/40 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted md:flex">
          <span className="flex-1">Proyecto</span>
          <span className="w-32 shrink-0">Rol</span>
          <span className="w-36 shrink-0">Estado</span>
          <span className="w-20 shrink-0 text-right">Postulado</span>
          <span className="w-8 shrink-0" aria-hidden />
        </div>

        {visibles.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm text-muted">
              {apps.length === 0
                ? "Todavía no postulaste a nada."
                : "No hay postulaciones en este estado."}
            </p>
            {apps.length === 0 && (
              <Link
                href="/proyectos"
                className="mt-2 inline-block text-sm font-medium text-electric hover:underline"
              >
                Ver proyectos
              </Link>
            )}
          </div>
        ) : (
          <ul>
            {visibles.map((a) => {
              const estado = ESTADO[a.status] ?? {
                label: a.status,
                tone: "neutral" as BadgeTone,
              };
              const proyecto = a.role?.project;
              const org = proyecto?.organization;
              const aceptada = a.status === "aceptada";
              return (
                <li
                  key={a.id}
                  className={cn(
                    "flex items-center gap-4 border-b border-border px-5 py-4 transition-colors last:border-0 hover:bg-surface/40",
                    // Resaltado sutil para lo que ya está aceptado — es el
                    // estado que más importa encontrar de un vistazo, no uno
                    // más entre los demás.
                    aceptada && "bg-sprout/5 hover:bg-sprout/10",
                  )}
                >
                  {/* Proyecto: logo de la organización + título + nombre */}
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <OrgLogo
                      logoUrl={org?.logo_url}
                      nombre={org?.nombre ?? proyecto?.titulo ?? ""}
                      size="md"
                    />
                    <div className="min-w-0">
                      <Link
                        href={`/proyectos/${proyecto?.id}`}
                        className="block truncate font-semibold text-ink hover:text-electric"
                      >
                        {proyecto?.titulo}
                      </Link>
                      {org?.nombre && (
                        <p className="truncate text-xs text-muted">{org.nombre}</p>
                      )}
                    </div>
                  </div>

                  {/* Rol (desktop) */}
                  <span className="hidden w-32 shrink-0 truncate text-sm text-muted md:block">
                    {a.role?.nombre}
                  </span>

                  {/* Estado (+ retirar si está en revisión). */}
                  <div className="flex w-auto shrink-0 flex-col items-start gap-1.5 md:w-36">
                    <Badge tone={estado.tone}>{estado.label}</Badge>
                    {a.status === "enviada" && (
                      <form action={withdrawApplication}>
                        <input type="hidden" name="applicationId" value={a.id} />
                        <SubmitButton
                          variant="ghost"
                          size="sm"
                          pendingText="Retirando…"
                        >
                          Retirar
                        </SubmitButton>
                      </form>
                    )}
                  </div>

                  {/* Fecha (desktop) */}
                  <span className="hidden w-20 shrink-0 text-right text-sm text-muted md:block">
                    {haceCuanto(a.created_at)}
                  </span>

                  {/* Acceso directo al espacio de trabajo, si ya está
                      aceptada — ícono, no texto: acá compite por espacio con
                      el resto de la fila, un link de texto se veía suelto. */}
                  <span className="flex w-8 shrink-0 justify-end">
                    {aceptada && proyecto?.id && (
                      <Link
                        href={`/proyecto/${proyecto.id}`}
                        aria-label="Ir al proyecto"
                        title="Ir al proyecto"
                        className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-electric/10 hover:text-electric"
                      >
                        <IconFlecha className="size-4" />
                      </Link>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
