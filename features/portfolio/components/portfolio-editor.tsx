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
import { PortafolioIconSvg } from "@/features/portfolio/components/portfolio-icons";

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
      {/* Evidencias existentes, o un estado vacío explícito si todavía no hay. */}
      {items.length > 0 ? (
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

                {/* Botones-ícono en fila, no texto apilado: más visibles y con
                    un área de toque real, mismo estilo que el botón de cerrar
                    del Modal. */}
                <div className="flex shrink-0 items-center gap-1">
                  <form action={togglePortfolioItemVisibility}>
                    <input type="hidden" name="itemId" value={it.id} />
                    <input
                      type="hidden"
                      name="visibility"
                      value={publico ? "privado" : "publico"}
                    />
                    <button
                      type="submit"
                      aria-label={publico ? "Hacer privada" : "Hacer pública"}
                      title={publico ? "Hacer privada" : "Hacer pública"}
                      className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-ink"
                    >
                      <PortafolioIconSvg name={publico ? "ojo" : "ojo_tachado"} />
                    </button>
                  </form>
                  <form action={deletePortfolioItem}>
                    <input type="hidden" name="itemId" value={it.id} />
                    <button
                      type="submit"
                      aria-label="Quitar evidencia"
                      title="Quitar evidencia"
                      className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-coral/10 hover:text-coral"
                    >
                      <PortafolioIconSvg name="papelera" />
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted">
          Todavía no agregaste ninguna evidencia.
        </p>
      )}

      {/* Agregar una evidencia: cada campo con su etiqueta e ícono visibles,
          no solo el placeholder (que no ayuda una vez que el campo tiene texto). */}
      <form
        ref={formRef}
        action={formAction}
        className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-4"
      >
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
            <PortafolioIconSvg name="titulo" className="size-4 text-muted" />
            Título
          </span>
          <Input name="titulo" placeholder="Ej: Dashboard de encuestas" />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
            <PortafolioIconSvg name="descripcion" className="size-4 text-muted" />
            Descripción <span className="text-muted">(opcional)</span>
          </span>
          <Textarea
            name="descripcion"
            placeholder="Qué hiciste, qué demuestra"
            className="min-h-14"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
            <PortafolioIconSvg name="enlace" className="size-4 text-muted" />
            Enlace <span className="text-muted">(opcional)</span>
          </span>
          <Input
            type="url"
            name="url"
            placeholder="https://… (repo, deploy, Figma, video)"
          />
        </label>

        {/* Ligar a un proyecto que integró (opcional, lo hace verificable). */}
        {projects.length > 0 && (
          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
              <PortafolioIconSvg name="proyecto" className="size-4 text-muted" />
              Proyecto asociado <span className="text-muted">(opcional)</span>
            </span>
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
          </label>
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
        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton pendingText="Agregando…">Agregar evidencia</SubmitButton>
          {/* Confirmación explícita: sin esto, agregar una evidencia solo
              vaciaba el formulario en silencio y la tarjeta nueva aparecía
              arriba, fuera de foco — no quedaba claro que había funcionado. */}
          {state.success && (
            <span
              role="status"
              className="flex items-center gap-1.5 text-sm font-medium text-sprout"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
              Evidencia agregada.
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
