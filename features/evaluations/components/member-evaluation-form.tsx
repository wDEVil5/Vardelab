"use client";

import { useActionState, useState } from "react";
import { evaluateMember, type EvaluateState } from "@/features/evaluations/actions";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/features/auth/components/submit-button";
import { cn } from "@/lib/utils";
import type { MemberEvaluation } from "@/features/evaluations/queries";

const INITIAL: EvaluateState = {};

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
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-ink">{label}</span>
      <div className="flex items-center gap-0.5">
        <input type="hidden" name={name} value={value} />
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${n} de 5`}
            aria-pressed={value >= n}
            className="p-0.5"
          >
            <svg
              viewBox="0 0 24 24"
              className={cn("size-5", value >= n ? "fill-electric text-electric" : "fill-none text-border")}
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinejoin="round"
            >
              <path d="M12 2.5l2.9 6.02 6.6.86-4.83 4.6 1.24 6.6L12 17.4l-5.91 3.18 1.24-6.6-4.83-4.6 6.6-.86z" />
            </svg>
          </button>
        ))}
      </div>
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

  return (
    <li className="flex flex-col gap-4 rounded-lg border border-border bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        {/* Avatar + nombre: antes la identidad se leía solo como texto plano
            arriba del formulario, sin ninguna referencia visual de "esto es
            un roster", no solo un formulario. */}
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-semibold text-ink">
            {iniciales(member.nombre)}
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-ink">{member.nombre}</span>
            {member.carrera && (
              <span className="text-xs text-muted">{member.carrera}</span>
            )}
          </div>
        </div>
        {member.rol && <Badge tone="brand">{member.rol}</Badge>}
      </div>

      <form action={formAction} className="flex flex-col gap-4 border-t border-border pt-4">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="evaluateeId" value={member.userId} />

        <StarRating
          name="calidad"
          label="Calidad del entregable"
          value={calidad}
          onChange={setCalidad}
        />
        <StarRating
          name="colaboracion"
          label="Colaboración"
          value={colaboracion}
          onChange={setColaboracion}
        />
        <StarRating
          name="cumplimientoHitos"
          label="Cumplimiento de hitos"
          value={cumplimientoHitos}
          onChange={setCumplimientoHitos}
        />

        <Textarea
          name="comentario"
          defaultValue={member.comentario ?? ""}
          placeholder="Retroalimentación para el integrante (opcional)"
          className="min-h-14"
        />

        {state.error && (
          <p role="alert" className="text-xs text-coral">
            {state.error}
          </p>
        )}
        {state.ok && (
          <p className="text-xs text-sprout">Evaluación guardada.</p>
        )}

        <div>
          <SubmitButton pendingText="Guardando…">
            {yaEvaluado ? "Actualizar evaluación" : "Evaluar"}
          </SubmitButton>
        </div>
      </form>
    </li>
  );
}
