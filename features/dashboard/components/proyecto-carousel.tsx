"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ProgressGauge } from "@/components/progress-gauge";
import type { ProyectoAbierto } from "@/features/dashboard/queries";

function diasRestantes(f: string | null): number | null {
  if (!f) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const d = new Date(`${f}T00:00:00`);
  return Math.round((d.getTime() - hoy.getTime()) / 86_400_000);
}

function vencimiento(n: number | null): string | null {
  if (n === null) return null;
  if (n < 0) return "vencido";
  if (n === 0) return "vence hoy";
  if (n === 1) return "vence mañana";
  return `vence en ${n} días`;
}

/**
 * Progreso + próximas entregas del proyecto activo. Con más de un proyecto
 * abierto, se convierte en un carrusel: los paneles se deslizan hacia la
 * izquierda y unos puntos abajo (o las flechas a los costados) permiten
 * moverse entre proyectos, en vez de mostrar solo el más avanzado y esconder
 * el resto.
 */
export function ProyectoCarousel({ proyectos }: { proyectos: ProyectoAbierto[] }) {
  const [indice, setIndice] = useState(0);

  if (proyectos.length === 0) return null;

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${indice * 100}%)` }}
        >
          {proyectos.map((p) => (
            <div key={p.id} className="w-full shrink-0">
              <div className="grid gap-4 lg:grid-cols-2">
                <PanelProgreso proyecto={p} />
                <PanelEntregas proyecto={p} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {proyectos.length > 1 && (
        <>
          {/* Flechas: solo si hay más de un proyecto que mostrar. */}
          <button
            type="button"
            onClick={() => setIndice((i) => Math.max(0, i - 1))}
            disabled={indice === 0}
            aria-label="Proyecto anterior"
            className="absolute top-1/2 -left-3 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-muted shadow-sm transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-0 sm:flex"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setIndice((i) => Math.min(proyectos.length - 1, i + 1))}
            disabled={indice === proyectos.length - 1}
            aria-label="Proyecto siguiente"
            className="absolute top-1/2 -right-3 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-muted shadow-sm transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-0 sm:flex"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>

          {/* Puntos: uno por proyecto, el activo resaltado. */}
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {proyectos.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setIndice(i)}
                aria-label={`Ver ${p.titulo}`}
                aria-current={i === indice}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === indice ? "w-5 bg-electric" : "w-1.5 bg-border hover:bg-muted/40",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PanelProgreso({ proyecto }: { proyecto: ProyectoAbierto }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          Progreso del proyecto
        </span>
      </div>
      <Link
        href={`/proyecto/${proyecto.id}`}
        className="mt-1 block truncate font-semibold text-ink transition-colors hover:text-electric"
      >
        {proyecto.titulo}
      </Link>

      <div className="mt-4 flex flex-col items-center">
        <ProgressGauge pct={proyecto.progreso} />
        <p className="mt-3 text-sm text-muted">
          <span className="font-medium text-ink">
            {proyecto.hitosAprobados} de {proyecto.hitosTotal}
          </span>{" "}
          hitos aprobados
          {proyecto.equipoTamano > 0 && ` · equipo de ${proyecto.equipoTamano}`}
        </p>
      </div>
    </div>
  );
}

function PanelEntregas({ proyecto }: { proyecto: ProyectoAbierto }) {
  const entregas = proyecto.hitos
    .filter((h) => h.estado !== "aprobado")
    .map((h) => ({ ...h, dias: diasRestantes(h.fechaLimite) }))
    .sort((a, b) => (a.dias ?? Infinity) - (b.dias ?? Infinity));

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-white p-6">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">
        Próximas entregas
      </span>

      {entregas.length > 0 ? (
        <ul className="mt-3 flex-1">
          {entregas.slice(0, 5).map((h) => {
            const venc = vencimiento(h.dias);
            const urgente = h.dias !== null && h.dias <= 2;
            const enCurso = h.estado === "en_progreso";
            return (
              <li key={h.id}>
                <Link
                  href={`/proyecto/${proyecto.id}`}
                  className="flex items-center gap-3 border-b border-border py-2.5 text-sm transition-colors last:border-0 hover:text-electric"
                >
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      enCurso ? "bg-electric" : "bg-border",
                    )}
                    aria-hidden
                  />
                  <span className="flex-1 truncate text-ink">{h.titulo}</span>
                  {venc && (
                    <span
                      className={cn(
                        "shrink-0 text-xs",
                        urgente ? "text-coral" : "text-muted",
                      )}
                    >
                      {venc}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 flex-1 text-sm text-muted">
          Sin entregas pendientes por ahora. Buen trabajo.
        </p>
      )}

      <Link
        href={`/proyecto/${proyecto.id}`}
        className="mt-4 inline-flex text-sm font-medium text-electric hover:underline"
      >
        Ir al proyecto →
      </Link>
    </div>
  );
}
