"use client";

import { useActionState } from "react";
import { evaluateMember, type EvaluateState } from "@/features/evaluations/actions";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/features/auth/components/submit-button";
import type { MemberEvaluation } from "@/features/evaluations/queries";

const INITIAL: EvaluateState = {};
const PUNTAJES = [1, 2, 3, 4, 5];

// Iniciales para el avatar del integrante — mismo criterio que en el resto
// del sitio.
function iniciales(nombre: string | null): string {
  const partes = (nombre ?? "").trim().split(/\s+/).slice(0, 2);
  return partes.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

/**
 * Evaluación de un integrante por el gestor: puntaje 1–5 + comentario. Precarga
 * la evaluación existente (re-evaluar actualiza la misma fila). La evaluación es
 * privada; solo la ven el integrante y el gestor.
 */
export function MemberEvaluationForm({
  member,
  projectId,
}: {
  member: MemberEvaluation;
  projectId: string;
}) {
  const [state, formAction] = useActionState(evaluateMember, INITIAL);
  const yaEvaluado = member.puntaje != null;

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4">
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

      <form action={formAction} className="flex flex-col gap-2 border-t border-border pt-3">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="evaluateeId" value={member.userId} />

        {/* Puntaje 1–5: radios estilados como botones. */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Puntaje</span>
          <div className="flex gap-1">
            {PUNTAJES.map((n) => (
              <label
                key={n}
                className="cursor-pointer rounded-md border border-border px-2.5 py-1 text-sm text-muted transition-colors has-checked:border-electric has-checked:bg-electric has-checked:text-white hover:border-electric"
              >
                <input
                  type="radio"
                  name="puntaje"
                  value={n}
                  defaultChecked={member.puntaje === n}
                  className="sr-only"
                />
                {n}
              </label>
            ))}
          </div>
        </div>

        <Textarea
          name="comentario"
          defaultValue={member.comentario ?? ""}
          placeholder="Comentario para el integrante (opcional)"
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
