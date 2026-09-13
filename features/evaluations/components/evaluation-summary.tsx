import type { EvaluationCriteria, MyEvaluation } from "@/features/evaluations/queries";

// Mismo degradado rojo → verde que usa `MemberEvaluationForm` (el lado del
// gestor), para que la vista de solo lectura del estudiante se sienta la
// misma evaluación, no una pantalla distinta.
const COLOR_ESTRELLA = ["#ff836e", "#ff9f5e", "#f5c344", "#a3d977", "#62d5a2"];

function Estrellas({ valor }: { valor: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => {
        const activa = valor >= n;
        return (
          <svg
            key={n}
            viewBox="0 0 24 24"
            className="size-4"
            fill={activa ? "currentColor" : "none"}
            style={activa ? { color: COLOR_ESTRELLA[valor - 1] } : undefined}
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinejoin="round"
          >
            <path d="M12 2.5l2.9 6.02 6.6.86-4.83 4.6 1.24 6.6L12 17.4l-5.91 3.18 1.24-6.6-4.83-4.6 6.6-.86z" />
          </svg>
        );
      })}
    </div>
  );
}

const CRITERIOS: { key: keyof EvaluationCriteria; label: string }[] = [
  { key: "calidad", label: "Calidad del entregable" },
  { key: "colaboracion", label: "Colaboración" },
  { key: "cumplimientoHitos", label: "Cumplimiento de hitos" },
];

/**
 * Evaluación que el estudiante recibió en un proyecto, de solo lectura —
 * contraparte de `MemberEvaluationForm` (el lado del gestor, que la carga).
 * No se muestra nada si `evaluation` es `null`: no hay evaluación todavía.
 */
export function EvaluationSummary({ evaluation }: { evaluation: MyEvaluation }) {
  return (
    <div className="flex flex-col gap-4">
      {evaluation.puntaje !== null && (
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold tracking-tight text-ink">
            {evaluation.puntaje}
          </span>
          <span className="text-sm text-muted">de 5</span>
        </div>
      )}

      {evaluation.criterios && (
        <div className="flex flex-col gap-2.5">
          {CRITERIOS.map((c) => (
            <div key={c.key} className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink">{c.label}</span>
              <Estrellas valor={evaluation.criterios![c.key]} />
            </div>
          ))}
        </div>
      )}

      {evaluation.comentario && (
        <p className="rounded-xl bg-surface px-4 py-3 text-sm text-ink">
          &ldquo;{evaluation.comentario}&rdquo;
        </p>
      )}
    </div>
  );
}
