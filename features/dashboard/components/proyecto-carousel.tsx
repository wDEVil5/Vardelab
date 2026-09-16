"use client";

import { useRef, useState, type PointerEvent, type WheelEvent } from "react";
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
 * Progreso + próximas entregas. Varios proyectos: una slide completa a la vez.
 * Swipe por transform (sin scroll-snap) para que no se sienta pegado; el gesto
 * horizontal solo se captura tras un umbral, así el scroll vertical de la página
 * sigue libre.
 */
export function ProyectoCarousel({
  proyectos,
}: {
  proyectos: ProyectoAbierto[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [indice, setIndice] = useState(0);
  const [arrastre, setArrastre] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);
  const [anchoContenedor, setAnchoContenedor] = useState(1);

  const drag = useRef<{
    pointerId: number | null;
    startX: number;
    startY: number;
    lastX: number;
    lastT: number;
    vx: number;
    locked: "h" | "v" | null;
    width: number;
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastT: 0,
    vx: 0,
    locked: null,
    width: 1,
  });

  const varios = proyectos.length > 1;
  const max = Math.max(proyectos.length - 1, 0);

  function irA(i: number) {
    const next = Math.min(Math.max(i, 0), max);
    setArrastre(0);
    setArrastrando(false);
    setIndice(next);
  }

  const wheelLock = useRef(false);

  function onWheel(e: WheelEvent<HTMLDivElement>) {
    if (!varios || wheelLock.current) return;
    const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.25;
    if (!horizontal || Math.abs(e.deltaX) < 12) return;
    // No preventDefault: evita trabar el scroll vertical del trackpad.
    wheelLock.current = true;
    if (e.deltaX > 0) irA(indice + 1);
    else irA(indice - 1);
    window.setTimeout(() => {
      wheelLock.current = false;
    }, 420);
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    // Solo swipe táctil. En desktop el scroll de la página y las flechas/puntos.
    if (!varios || e.button !== 0 || e.pointerType !== "touch") return;
    const el = trackRef.current;
    const width = Math.max(el?.parentElement?.clientWidth ?? 1, 1);
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastT: performance.now(),
      vx: 0,
      locked: null,
      width,
    };
    setAnchoContenedor(width);
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (d.pointerId !== e.pointerId) return;

    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    if (d.locked === null) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      // Solo reclama el gesto si es claramente horizontal.
      if (Math.abs(dx) > Math.abs(dy) * 1.2) {
        d.locked = "h";
        e.currentTarget.setPointerCapture(e.pointerId);
        setArrastrando(true);
      } else {
        d.locked = "v";
        d.pointerId = null;
        return;
      }
    }

    if (d.locked !== "h") return;

    const now = performance.now();
    const dt = Math.max(now - d.lastT, 1);
    d.vx = ((e.clientX - d.lastX) / dt) * 1000;
    d.lastX = e.clientX;
    d.lastT = now;

    // Resistencia suave en los extremos.
    let offset = dx;
    if ((indice === 0 && dx > 0) || (indice === max && dx < 0)) {
      offset = dx * 0.35;
    }
    setArrastre(offset);
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (d.pointerId !== e.pointerId) return;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    const wasHorizontal = d.locked === "h";
    d.pointerId = null;
    d.locked = null;

    if (!wasHorizontal) {
      setArrastre(0);
      setArrastrando(false);
      return;
    }

    const width = d.width;
    const dx = e.clientX - d.startX;
    const umbral = Math.min(width * 0.22, 96);
    let next = indice;

    if (Math.abs(d.vx) > 450) {
      next = d.vx < 0 ? indice + 1 : indice - 1;
    } else if (dx <= -umbral) {
      next = indice + 1;
    } else if (dx >= umbral) {
      next = indice - 1;
    }

    setArrastre(0);
    setArrastrando(false);
    setIndice(Math.min(Math.max(next, 0), max));
  }

  function onPointerCancel(e: PointerEvent<HTMLDivElement>) {
    if (drag.current.pointerId !== e.pointerId) return;
    drag.current.pointerId = null;
    drag.current.locked = null;
    setArrastre(0);
    setArrastrando(false);
  }

  if (proyectos.length === 0) return null;

  const pct = -(indice * 100);
  const dragPct = arrastre === 0 ? 0 : (arrastre / anchoContenedor) * 100;

  return (
    <div className="relative">
      <div
        className={cn(
          "overflow-hidden",
          varios && "touch-pan-y",
        )}
        onPointerDown={varios ? onPointerDown : undefined}
        onPointerMove={varios ? onPointerMove : undefined}
        onPointerUp={varios ? onPointerUp : undefined}
        onPointerCancel={varios ? onPointerCancel : undefined}
        onWheel={varios ? onWheel : undefined}
      >
        <div
          ref={trackRef}
          className={cn(
            "flex will-change-transform",
            !arrastrando && "transition-transform duration-300 ease-out",
          )}
          style={{
            transform: `translate3d(calc(${pct}% + ${dragPct}%), 0, 0)`,
          }}
        >
          {proyectos.map((p) => (
            <div
              key={p.id}
              data-proyecto-slide
              className="w-full min-w-full max-w-full shrink-0"
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <PanelProgreso proyecto={p} />
                <PanelEntregas proyecto={p} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {varios && (
        <>
          <button
            type="button"
            onClick={() => irA(indice - 1)}
            disabled={indice === 0}
            aria-label="Proyecto anterior"
            className="absolute top-1/2 -left-3 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-muted shadow-sm transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-0 sm:flex"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => irA(indice + 1)}
            disabled={indice === max}
            aria-label="Proyecto siguiente"
            className="absolute top-1/2 -right-3 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-muted shadow-sm transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-0 sm:flex"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>

          <div className="mt-3 flex items-center justify-center gap-1.5">
            {proyectos.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => irA(i)}
                aria-label={`Ver ${p.titulo}`}
                aria-current={i === indice}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === indice
                    ? "w-5 bg-electric"
                    : "w-1.5 bg-border hover:bg-muted/40",
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
