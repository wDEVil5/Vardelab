"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  addPortfolioItem,
  deletePortfolioItem,
  togglePortfolioItemVisibility,
  type PortfolioState,
} from "@/features/portfolio/actions";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/features/auth/components/submit-button";
import type { PortfolioItem } from "@/features/portfolio/queries";

const INITIAL: PortfolioState = {};

// Proyecto al que se puede ligar una evidencia (los que el estudiante integró).
type ProjectOption = { id: string; titulo: string };

/**
 * Editor del portafolio: lista las evidencias (con su visibilidad y opción de
 * quitarlas) y un formulario para agregar. Ligar la evidencia a un proyecto en
 * el que se participó es lo que la vuelve verificable, no una simple afirmación.
 */
export function PortfolioEditor({
  items,
  projects,
}: {
  items: PortfolioItem[];
  projects: ProjectOption[];
}) {
  const [state, formAction] = useActionState(addPortfolioItem, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);
  const enviado = useRef(false);

  useEffect(() => {
    if (enviado.current && !state.error) formRef.current?.reset();
    enviado.current = true;
  }, [state]);

  return (
    <div className="flex flex-col gap-4">
      {/* Evidencias existentes */}
      {items.length > 0 && (
        <ul className="flex flex-col gap-2">
          {items.map((it) => {
            const publico = it.visibility === "publico";
            return (
              <li
                key={it.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border bg-white p-4"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">
                      {it.titulo}
                    </span>
                    <Badge tone={publico ? "success" : "neutral"}>
                      {publico ? "Público" : "Privado"}
                    </Badge>
                  </div>
                  {it.descripcion && (
                    <p className="text-sm text-muted">{it.descripcion}</p>
                  )}
                  {it.url && (
                    <a
                      href={it.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-electric hover:underline"
                    >
                      {it.url}
                    </a>
                  )}
                  {it.project?.titulo && (
                    <span className="text-xs text-muted">
                      Proyecto: {it.project.titulo}
                    </span>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <form action={togglePortfolioItemVisibility}>
                    <input type="hidden" name="itemId" value={it.id} />
                    <input
                      type="hidden"
                      name="visibility"
                      value={publico ? "privado" : "publico"}
                    />
                    <button
                      type="submit"
                      className="text-xs text-muted hover:text-electric"
                    >
                      {publico ? "Hacer privada" : "Hacer pública"}
                    </button>
                  </form>
                  <form action={deletePortfolioItem}>
                    <input type="hidden" name="itemId" value={it.id} />
                    <button
                      type="submit"
                      className="text-xs text-muted/60 hover:text-coral"
                    >
                      Quitar
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Agregar una evidencia */}
      <form
        ref={formRef}
        action={formAction}
        className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-4"
      >
        <Input name="titulo" placeholder="Título de la evidencia" />
        <Textarea
          name="descripcion"
          placeholder="Qué hiciste, qué demuestra (opcional)"
          className="min-h-14"
        />
        <Input
          type="url"
          name="url"
          placeholder="https://… enlace al trabajo (repo, deploy, Figma, video)"
        />

        {/* Ligar a un proyecto que integró (opcional, lo hace verificable). */}
        {projects.length > 0 && (
          <select
            name="projectId"
            defaultValue=""
            className="rounded-md border border-border bg-white px-3 py-2 text-sm text-ink"
          >
            <option value="">Sin proyecto asociado</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.titulo}
              </option>
            ))}
          </select>
        )}

        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" name="publico" className="size-4" />
          Publicarla en mi página pública
        </label>

        {state.error && (
          <p role="alert" className="text-xs text-coral">
            {state.error}
          </p>
        )}
        <div>
          <SubmitButton pendingText="Agregando…">Agregar evidencia</SubmitButton>
        </div>
      </form>
    </div>
  );
}
