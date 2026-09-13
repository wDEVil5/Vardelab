"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { evaluateMember, type EvaluateState } from "@/features/evaluations/actions";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/features/auth/components/submit-button";
import { cn } from "@/lib/utils";
import type { MemberEvaluation } from "@/features/evaluations/queries";

const INITIAL: EvaluateState = {};

// Degradado rojo → verde según qué tan bien calificado está cada punto.
const COLOR_ESTRELLA = ["#ff836e", "#ff9f5e", "#f5c344", "#a3d977", "#62d5a2"];

// Iniciales para el avatar del integrante — mismo criterio que en el resto
// del sitio.
function iniciales(nombre: string | null): string {
  const partes = (nombre ?? "").trim().split(/\s+/).slice(0, 2);
  return partes.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

/** Fila de 5 estrellas para un criterio. Controlada: reporta el valor elegido. */
function StarRating({
  name,
  label,
  description,
  value,
  onChange,
}: {
  name: string;
  label: string;
  description: string;
  value: number;
  onChange: (n: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const activo = hover ?? value;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-ink">{label}</span>
        <div
          className="flex items-center gap-0.5"
          onMouseLeave={() => setHover(null)}
        >
          <input type="hidden" name={name} value={value} />
          {[1, 2, 3, 4, 5].map((n) => {
            const activa = activo >= n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                onMouseEnter={() => setHover(n)}
                aria-label={`${n} de 5`}
                aria-pressed={value >= n}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <svg
                  viewBox="0 0 24 24"
                  className={cn("size-6 transition-colors", activa ? "fill-current" : "fill-none text-border")}
                  style={activa ? { color: COLOR_ESTRELLA[n - 1] } : undefined}
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                >
                  <path d="M12 2.5l2.9 6.02 6.6.86-4.83 4.6 1.24 6.6L12 17.4l-5.91 3.18 1.24-6.6-4.83-4.6 6.6-.86z" />
                </svg>
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-muted">{description}</p>
    </div>
  );
}

/**
 * Evaluación de un integrante por el gestor: tres criterios con estrellas
 * (calidad, colaboración, cumplimiento de hitos) + comentario (S-06). Precarga
 * la evaluación existente (re-evaluar actualiza la misma fila). La evaluación
 * es privada; solo la ven el integrante y el gestor.
 */
export function MemberEvaluationForm({
  member,
  projectId,
}: {
  member: MemberEvaluation;
  projectId: string;
}) {
  const [state, formAction] = useActionState(evaluateMember, INITIAL);
  const [calidad, setCalidad] = useState(member.criterios?.calidad ?? 0);
  const [colaboracion, setColaboracion] = useState(member.criterios?.colaboracion ?? 0);
  const [cumplimientoHitos, setCumplimientoHitos] = useState(
    member.criterios?.cumplimientoHitos ?? 0,
  );
  const yaEvaluado = member.puntaje != null;
  const [open, setOpen] = useState(false);

  return (
    <li className="flex flex-col rounded-lg border border-border bg-white transition-all hover:border-electric/30 hover:shadow-sm">
      {/* Fila resumen: con muchos integrantes, mostrar el formulario completo
          de cada uno haría la lista interminable — colapsada por defecto,
          se abre una a la vez al hacer clic. */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        aria-expanded={open}
        className="flex cursor-pointer items-center justify-between gap-4 p-7 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-semibold text-ink">
            {iniciales(member.nombre)}
          </span>
          <div className="flex flex-col gap-0.5">
            {member.perfilPublico ? (
              <Link
                href={`/u/${member.userId}`}
                onClick={(e) => e.stopPropagation()}
                className="w-fit text-sm font-medium text-ink hover:text-electric hover:underline"
              >
                {member.nombre}
              </Link>
            ) : (
              <span className="text-sm font-medium text-ink">{member.nombre}</span>
            )}
            {member.carrera && (
              <span className="text-xs text-muted">{member.carrera}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {member.rol && <Badge tone="brand">{member.rol}</Badge>}
          <Badge tone={yaEvaluado ? "success" : "neutral"}>
            {yaEvaluado ? "Evaluado" : "Pendiente"}
          </Badge>
          <svg
            viewBox="0 0 24 24"
            className={cn("size-4 shrink-0 text-muted transition-transform", open && "rotate-180")}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      <div
        className={cn(
          "grid border-t transition-[grid-template-rows,border-color] duration-300 ease-out",
          open ? "grid-rows-[1fr] border-border" : "grid-rows-[0fr] border-transparent",
        )}
      >
      <div className="overflow-hidden">
      <form action={formAction} className="flex flex-col gap-5 p-7">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="evaluateeId" value={member.userId} />

        <div className="flex flex-col gap-5 rounded-md bg-surface/60 px-5 py-5">
          <StarRating
            name="calidad"
            label="Calidad del entregable"
            description="Qué tan completo y bien hecho está lo que entregó."
            value={calidad}
            onChange={setCalidad}
          />
          <StarRating
            name="colaboracion"
            label="Colaboración"
            description="Qué tanto aportó y se coordinó con el resto del equipo."
            value={colaboracion}
            onChange={setColaboracion}
          />
          <StarRating
            name="cumplimientoHitos"
            label="Cumplimiento de hitos"
            description="Si entregó a tiempo según lo acordado para este rol."
            value={cumplimientoHitos}
            onChange={setCumplimientoHitos}
          />
        </div>

        <Textarea
          name="comentario"
          defaultValue={member.comentario ?? ""}
          placeholder="Retroalimentación para el integrante (opcional)"
          className="min-h-24"
        />

        {state.error && (
          <p role="alert" className="text-xs text-coral">
            {state.error}
          </p>
        )}
        {state.ok && (
          <p className="text-xs text-sprout">Evaluación guardada.</p>
        )}

        <SubmitButton pendingText="Guardando…">
          {yaEvaluado ? "Actualizar evaluación" : "Evaluar"}
        </SubmitButton>
      </form>
      </div>
      </div>
    </li>
  );
}
