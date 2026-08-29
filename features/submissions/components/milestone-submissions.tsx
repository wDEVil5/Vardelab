"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  addSubmission,
  deleteSubmission,
  type SubmissionState,
} from "@/features/submissions/actions";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/features/auth/components/submit-button";
import type { MilestoneWithSubmissions } from "@/features/milestones/queries";

const INITIAL: SubmissionState = {};

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  entregado: "Entregado",
  aprobado: "Aprobado",
};

/**
 * Un hito con sus entregas (vista del integrante): lista lo entregado y permite
 * subir una entrega (enlace + nota). El modelo es "enlace + contexto", no subir
 * el trabajo: la URL apunta a dónde vive (repo, deploy, Figma, video…).
 */
export function MilestoneSubmissions({
  milestone,
  projectId,
  currentUserId,
}: {
  milestone: MilestoneWithSubmissions;
  projectId: string;
  currentUserId: string;
}) {
  const [state, formAction] = useActionState(addSubmission, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);
  const enviado = useRef(false);

  useEffect(() => {
    if (enviado.current && !state.error) formRef.current?.reset();
    enviado.current = true;
  }, [state]);

  const submissions = milestone.submissions ?? [];
  const aprobado = milestone.estado === "aprobado";
  // El gestor devolvió el hito para correcciones (ver acción returnMilestone).
  const pidioCambios = milestone.estado === "en_progreso";

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-ink">{milestone.titulo}</span>
        <Badge>{ESTADO_LABEL[milestone.estado] ?? milestone.estado}</Badge>
      </div>
      {milestone.descripcion && (
        <p className="mt-1 text-xs text-muted">{milestone.descripcion}</p>
      )}
      {milestone.fecha_limite && (
        <p className="mt-0.5 text-xs text-muted">
          Fecha límite: {milestone.fecha_limite}
        </p>
      )}

      {/* Entregas ya hechas */}
      {submissions.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {submissions.map((s) => (
            <li
              key={s.id}
              className="flex items-start justify-between gap-3 rounded-md bg-surface/60 p-3"
            >
              <div className="flex flex-col gap-0.5">
                {s.url && (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-electric hover:underline"
                  >
                    {s.url}
                  </a>
                )}
                {s.nota && <span className="text-xs text-muted">{s.nota}</span>}
              </div>
              {s.submitted_by === currentUserId && (
                <form action={deleteSubmission}>
                  <input type="hidden" name="submissionId" value={s.id} />
                  <input type="hidden" name="projectId" value={projectId} />
                  <button
                    type="submit"
                    aria-label="Eliminar entrega"
                    className="text-xs text-muted/60 hover:text-coral"
                  >
                    Quitar
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Aviso de revisión: aprobado o devuelto para correcciones. */}
      {aprobado && (
        <p className="mt-3 text-xs text-sprout">
          Aprobado por el gestor. No necesitas entregar más.
        </p>
      )}
      {pidioCambios && (
        <p className="mt-3 text-xs text-coral">
          El gestor pidió cambios. Ajusta el trabajo y vuelve a entregar.
        </p>
      )}

      {/* Subir una entrega (salvo que el hito ya esté aprobado). */}
      {!aprobado && (
      <form ref={formRef} action={formAction} className="mt-3 flex flex-col gap-2">
        <input type="hidden" name="milestoneId" value={milestone.id} />
        <input type="hidden" name="projectId" value={projectId} />
        <Input
          type="url"
          name="url"
          placeholder="https://… enlace al trabajo (repo, deploy, Figma, video)"
        />
        <Textarea
          name="nota"
          placeholder="Qué entregas en este hito (opcional)"
          className="min-h-14"
        />
        {state.error && (
          <p role="alert" className="text-xs text-coral">
            {state.error}
          </p>
        )}
        <div>
          <SubmitButton pendingText="Enviando…">Subir entrega</SubmitButton>
        </div>
      </form>
      )}
    </div>
  );
}
