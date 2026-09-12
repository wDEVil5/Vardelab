"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { buttonClasses } from "@/components/ui/button";
import {
  uploadAvatar,
  selectAvatarPreset,
  type AvatarState,
} from "@/features/profile/actions";
import type { AvatarPreset } from "@/features/profile/queries";

const INITIAL: AvatarState = {};

/**
 * Círculo de avatar que abre un modal con dos formas de cambiarlo: subir una
 * foto propia, o elegir uno del catálogo (M26 — hoy son placeholders con los
 * colores de marca; se van a reemplazar por imágenes definitivas sin tocar
 * este componente, solo la tabla `avatar_presets`).
 */
export function AvatarPicker({
  avatarUrl,
  iniciales,
  presets,
}: {
  avatarUrl: string | null;
  iniciales: string;
  presets: AvatarPreset[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Cambiar foto de perfil"
        className="group relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-electric text-xl font-semibold text-white"
      >
        {avatarUrl ? (
          // Foto propia (M25) o avatar del catálogo (M26); ambos casos son
          // imágenes propias de la app, no una URL externa arbitraria.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-16 object-cover"
          />
        ) : (
          iniciales
        )}
        <span className="absolute inset-0 hidden items-center justify-center bg-ink/50 text-[10px] font-medium text-white group-hover:flex">
          Cambiar
        </span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Foto de perfil">
        <div className="flex flex-col gap-6">
          <UploadSection onDone={() => setOpen(false)} />

          <div className="border-t border-border pt-5">
            <p className="text-sm font-medium text-ink">O elige un avatar</p>
            <p className="mt-1 text-xs text-muted">
              Iremos sumando más opciones con el tiempo.
            </p>
            {presets.length > 0 ? (
              <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
                {presets.map((p) => (
                  <PresetButton
                    key={p.id}
                    preset={p}
                    onDone={() => setOpen(false)}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">
                Todavía no hay avatares para elegir.
              </p>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}

/** Bloque de "subir tu foto": auto-envía al elegir un archivo. */
function UploadSection({ onDone }: { onDone: () => void }) {
  const [state, formAction, pending] = useActionState(uploadAvatar, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cierra el modal cuando la subida termina bien (transición pending → listo,
  // sin error). El modal no se desmonta solo: la página se revalida, pero este
  // componente sigue montado con nuevas props.
  const eraPending = useRef(false);
  useEffect(() => {
    if (eraPending.current && !pending && !state.error) onDone();
    eraPending.current = pending;
  }, [pending, state.error, onDone]);

  return (
    <div>
      <p className="text-sm font-medium text-ink">Sube tu foto</p>
      <form
        ref={formRef}
        action={formAction}
        className="mt-2 flex flex-wrap items-center gap-3"
      >
        <input
          ref={inputRef}
          type="file"
          name="avatar"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={() => formRef.current?.requestSubmit()}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className={buttonClasses({ variant: "secondary", size: "sm" })}
        >
          {pending ? "Subiendo…" : "Elegir archivo"}
        </button>
        <span className="text-xs text-muted">PNG, JPG o WEBP · máx. 2 MB</span>
      </form>
      {state.error && (
        <p role="alert" className="mt-1.5 text-xs text-coral">
          {state.error}
        </p>
      )}
    </div>
  );
}

/** Miniatura seleccionable de un avatar del catálogo. */
function PresetButton({
  preset,
  onDone,
}: {
  preset: AvatarPreset;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    selectAvatarPreset,
    INITIAL,
  );

  const eraPending = useRef(false);
  useEffect(() => {
    if (eraPending.current && !pending && !state.error) onDone();
    eraPending.current = pending;
  }, [pending, state.error, onDone]);

  return (
    <form action={formAction}>
      <input type="hidden" name="presetId" value={preset.id} />
      <button
        type="submit"
        disabled={pending}
        aria-label={`Usar avatar ${preset.etiqueta}`}
        title={preset.etiqueta}
        className="aspect-square w-full overflow-hidden rounded-full border-2 border-transparent transition-colors hover:border-electric disabled:opacity-60"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={preset.url}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      </button>
    </form>
  );
}
