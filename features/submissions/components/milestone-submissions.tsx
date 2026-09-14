"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  addSubmission,
  deleteSubmission,
  type SubmissionState,
} from "@/features/submissions/actions";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/features/auth/components/submit-button";
import { cn } from "@/lib/utils";
import type { MilestoneWithSubmissions } from "@/features/milestones/queries";

const INITIAL: SubmissionState = {};

// Misma etiqueta y color que ya usa la vista general del proyecto (E-05) para
// cada estado — antes acá decía "Entregado" para el mismo estado que ahí dice
// "En revisión", una inconsistencia de texto entre las dos pantallas.
const ESTADO: Record<string, { label: string; tone: BadgeTone }> = {
  pendiente: { label: "Pendiente", tone: "neutral" },
  en_progreso: { label: "En progreso", tone: "danger" },
  entregado: { label: "En revisión", tone: "brand" },
  aprobado: { label: "Completado", tone: "success" },
};

/** Ícono de papelera, mismo trazo que el resto de los íconos chicos del sitio. */
function IconPapelera({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0v12a1 1 0 001 1h6a1 1 0 001-1V7" />
    </svg>
  );
}

/** Ícono de clip, para el adjunto de archivo. */
function IconClip({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21.44 11.05l-9.19 9.19a5.5 5.5 0 01-7.78-7.78l9.19-9.19a3.5 3.5 0 014.95 4.95l-9.2 9.19a1.5 1.5 0 01-2.12-2.12l8.49-8.48" />
    </svg>
  );
}

/** Ícono de documento, para el link de descarga de un archivo entregado. */
function IconDocumento({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

/** Ícono de "x", para quitar el archivo elegido antes de enviar. */
function IconX({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

/** Ícono de check, para el aviso de hito aprobado. */
function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

// Mismos tipos que el bucket `submission-files` (M48), como texto para el
// atributo `accept` del input.
const ARCHIVO_ACCEPT =
  "application/pdf,image/png,image/jpeg,image/webp,application/zip,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function formatearTamano(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
  const archivoInputRef = useRef<HTMLInputElement>(null);
  const enviado = useRef(false);
  // El archivo elegido vive en estado (el objeto File, no solo su nombre) para
  // poder mostrar nombre + tamaño y permitir quitarlo — antes solo se guardaba
  // el nombre y no había forma de deshacer la selección antes de enviar.
  const [archivo, setArchivo] = useState<File | null>(null);

  useEffect(() => {
    if (enviado.current && !state.error) {
      formRef.current?.reset();
      setArchivo(null);
    }
    enviado.current = true;
  }, [state]);

  // Limpia también el input nativo, no solo el estado: si no, el archivo
  // seguiría ahí (el input es quien realmente se envía con el formulario).
  function quitarArchivo() {
    setArchivo(null);
    if (archivoInputRef.current) archivoInputRef.current.value = "";
  }

  const submissions = milestone.submissions ?? [];
  const aprobado = milestone.estado === "aprobado";
  // El gestor devolvió el hito para correcciones (ver acción returnMilestone).
  const pidioCambios = milestone.estado === "en_progreso";
  const est = ESTADO[milestone.estado] ?? ESTADO.pendiente;

  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-lg font-semibold text-ink">{milestone.titulo}</span>
          {milestone.descripcion && (
            <p className="mt-1 text-sm text-muted">{milestone.descripcion}</p>
          )}
          {milestone.fecha_limite && (
            <p className="mt-1 text-xs text-muted">
              Fecha límite: {milestone.fecha_limite}
            </p>
          )}
        </div>
        <Badge tone={est.tone} className="shrink-0">
          {est.label}
        </Badge>
      </div>

      {/* Entregas ya hechas */}
      {submissions.length > 0 && (
        <ul className="mt-5 flex flex-col gap-2 border-t border-border pt-5">
          {submissions.map((s) => (
            <li
              key={s.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface/60 p-4"
            >
              <div className="flex flex-col gap-1">
                {s.url && (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-electric hover:underline"
                  >
                    {s.url}
                  </a>
                )}
                {s.archivo_url && (
                  <a
                    href={s.archivo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm font-medium text-electric hover:underline"
                  >
                    <IconDocumento className="size-4 shrink-0" />
                    Descargar archivo adjunto
                  </a>
                )}
                {s.nota && <span className="text-sm text-muted">{s.nota}</span>}
              </div>
              {/* No se puede borrar una entrega de un hito ya aprobado —
                  sería borrar la evidencia de algo que el gestor ya dio por
                  bueno. */}
              {!aprobado && s.submitted_by === currentUserId && (
                <form action={deleteSubmission}>
                  <input type="hidden" name="submissionId" value={s.id} />
                  <input type="hidden" name="projectId" value={projectId} />
                  <button
                    type="submit"
                    aria-label="Eliminar entrega"
                    title="Eliminar entrega"
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-coral/10 hover:text-coral"
                  >
                    <IconPapelera className="size-4" />
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Aviso de revisión: aprobado o devuelto para correcciones. El de
          aprobado tiene más peso visual (ícono + título) que una línea de
          texto — sin el checklist al lado (solo aplica mientras hay algo por
          entregar), esta tarjeta es lo único que queda en pantalla, así que
          necesita sostenerse sola. */}
      {aprobado && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-sprout/30 bg-sprout/10 p-5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sprout text-white">
            <IconCheck className="size-5" />
          </span>
          <div>
            <p className="font-semibold text-ink">Hito aprobado</p>
            <p className="mt-0.5 text-sm text-ink/80">
              El gestor dio por bueno este hito. No necesitas entregar más.
            </p>
            {submissions.length === 0 && (
              <p className="mt-2 text-xs text-ink/60">
                No quedó evidencia registrada para este hito.
              </p>
            )}
          </div>
        </div>
      )}
      {pidioCambios && (
        <p className="mt-5 rounded-lg border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-ink">
          El gestor pidió cambios. Ajusta el trabajo y vuelve a entregar.
        </p>
      )}

      {/* Subir una entrega (salvo que el hito ya esté aprobado). */}
      {!aprobado && (
        <form
          ref={formRef}
          action={formAction}
          className={cn(
            "mt-5 flex flex-col gap-3",
            (submissions.length > 0 || pidioCambios) && "border-t border-border pt-5",
          )}
        >
          <p className="text-sm font-medium text-ink">Nueva entrega</p>
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

          {/* Archivo opcional: para lo que no vive en ningún lado más (un PDF,
              una imagen, un documento) — el enlace de arriba sigue siendo lo
              correcto para un repo, un deploy o un Figma. */}
          <input
            ref={archivoInputRef}
            type="file"
            name="archivo"
            accept={ARCHIVO_ACCEPT}
            className="hidden"
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
          />
          {archivo ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface/60 p-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-electric/10 text-electric">
                  <IconDocumento className="size-4" />
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-ink">
                    {archivo.name}
                  </span>
                  <span className="text-xs text-muted">
                    {formatearTamano(archivo.size)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={quitarArchivo}
                aria-label="Quitar archivo"
                title="Quitar archivo"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-coral/10 hover:text-coral"
              >
                <IconX className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => archivoInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg border border-dashed border-border p-3 text-left text-sm font-medium text-muted transition-colors hover:border-electric/40 hover:text-electric"
            >
              <IconClip className="size-4 shrink-0" />
              Adjuntar archivo
              <span className="ml-auto text-xs font-normal text-muted">
                PDF, Word, imagen o ZIP · máx. 20 MB
              </span>
            </button>
          )}
          <p className="text-xs text-muted">
            Por ahora se admite un solo archivo por entrega. Si necesitas
            enviar varios, comprímelos en un .zip y adjunta ese archivo.
          </p>

          {state.error && (
            <p role="alert" className="text-sm text-coral">
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
