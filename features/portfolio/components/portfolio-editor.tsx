"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  addPortfolioItem,
  deletePortfolioItem,
  togglePortfolioItemVisibility,
  type PortfolioState,
} from "@/features/portfolio/actions";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SubmitButton } from "@/components/ui/submit-button";
import type { PortfolioItem } from "@/features/portfolio/queries";
import { PortafolioIconSvg } from "@/features/portfolio/components/portfolio-icons";

const INITIAL: PortfolioState = {};

// Proyecto al que se puede ligar una evidencia (los que el estudiante integró).
type ProjectOption = { id: string; titulo: string };

/**
 * Formulario de "agregar evidencia", pensado para vivir dentro de un modal
 * (ver `PortfolioEditor` más abajo): al agregar con éxito avisa a quien lo
 * contiene vía `onAdded` para que cierre el modal — la lista de evidencias
 * (fuera del modal) se actualiza sola porque `addPortfolioItem` revalida la
 * página.
 */
function AddPortfolioItemForm({
  projects,
  onAdded,
}: {
  projects: ProjectOption[];
  onAdded: () => void;
}) {
  const [state, formAction] = useActionState(addPortfolioItem, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) onAdded();
  }, [state, onAdded]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
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
      <SubmitButton pendingText="Agregando…">Agregar evidencia</SubmitButton>
    </form>
  );
}

/**
 * Editor del portafolio: lista las evidencias (con su visibilidad y opción de
 * quitarlas) y un botón que abre el formulario de agregar en un modal — antes
 * el formulario completo quedaba siempre abierto en la página, aunque el
 * portafolio estuviera vacío. Ligar la evidencia a un proyecto en el que se
 * participó es lo que la vuelve verificable, no una simple afirmación.
 */
export function PortfolioEditor({
  items,
  projects,
}: {
  items: PortfolioItem[];
  projects: ProjectOption[];
}) {
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PortfolioItem | null>(null);
  const [deleteError, setDeleteError] = useState<string>();
  const [deletePending, startDelete] = useTransition();

  const confirmDelete = (formData: FormData) => {
    startDelete(async () => {
      const result = await deletePortfolioItem({}, formData);
      if (result.success) {
        setDeleteTarget(null);
        setDeleteError(undefined);
      } else {
        setDeleteError(result.error ?? "No se pudo eliminar la evidencia.");
      }
    });
  };

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
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError(undefined);
                      setDeleteTarget(it);
                    }}
                    aria-label="Quitar evidencia"
                    title="Quitar evidencia"
                    className="flex size-8 items-center justify-center rounded-lg text-coral transition-colors hover:bg-coral/10"
                  >
                    <PortafolioIconSvg name="papelera" />
                  </button>
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

      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(buttonClasses({ variant: "outline", size: "sm" }), "self-start gap-1.5")}
      >
        <PortafolioIconSvg name="agregar" className="size-4" />
        Agregar evidencia
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Agregar evidencia">
        <AddPortfolioItemForm projects={projects} onAdded={() => setOpen(false)} />
      </Modal>

      <Modal
        open={deleteTarget !== null}
        busy={deletePending}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar evidencia"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink">
            ¿Eliminar la evidencia <strong>{deleteTarget?.titulo}</strong>? Esta
            acción no se puede deshacer.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              confirmDelete(new FormData(event.currentTarget));
            }}
            className="flex justify-end gap-2"
          >
            <input type="hidden" name="itemId" value={deleteTarget?.id ?? ""} />
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className={buttonClasses({ variant: "ghost", size: "sm" })}
            >
              Cancelar
            </button>
            <SubmitButton
              variant="danger"
              size="sm"
              pendingText="Eliminando…"
            >
              Sí, eliminar
            </SubmitButton>
          </form>

          {deleteError && (
            <p role="alert" className="text-sm text-coral">
              {deleteError}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
