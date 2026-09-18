"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  function handleDone() {
    setOpen(false);
    router.refresh();
  }

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
          <UploadSection onDone={handleDone} />

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
                    onDone={handleDone}
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
  const [, startUpload] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Cierra el modal cuando la subida termina bien (transición pending → listo,
  // sin error). El modal no se desmonta solo: la página se revalida, pero este
  // componente sigue montado con nuevas props.
  const eraPending = useRef(false);
  useEffect(() => {
    if (eraPending.current && !pending && !state.error) {
      queueMicrotask(() => replacePreview(null));
      onDone();
    }
    eraPending.current = pending;
  }, [pending, state.error, onDone]);

  function replacePreview(nextUrl: string | null) {
    setPreviewUrl(nextUrl);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLocalError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setLocalError("No se pudo cargar la imagen. Elige otro archivo.");
        return;
      }
      const image = new Image();
      image.onload = () => replacePreview(reader.result as string);
      image.onerror = () => setLocalError("No se pudo cargar la imagen. Elige un JPG, PNG o WEBP válido.");
      image.src = reader.result;
    };
    reader.onerror = () => setLocalError("No se pudo leer la imagen. Elige otro archivo.");
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  async function handleCropConfirm(file: File) {
    const data = new FormData();
    data.set("avatar", file);
    startUpload(() => formAction(data));
  }

  return (
    <div>
      <p className="text-sm font-medium text-ink">Sube tu foto</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileChange}
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
      </div>
      {(localError || state.error) && (
        <p role="alert" className="mt-1.5 text-xs text-coral">
          {localError || state.error}
        </p>
      )}
      <Modal
        open={Boolean(previewUrl)}
        onClose={() => replacePreview(null)}
        title="Ajusta tu foto de perfil"
        busy={pending}
      >
        {previewUrl && (
          <CropEditor
            key={previewUrl}
            src={previewUrl}
            pending={pending}
            uploadError={state.error}
            onPreviewError={() => {
              replacePreview(null);
              setLocalError("No se pudo cargar la imagen. Elige un JPG, PNG o WEBP válido.");
            }}
            onCancel={() => replacePreview(null)}
            onChooseAnother={() => inputRef.current?.click()}
            onConfirm={handleCropConfirm}
          />
        )}
      </Modal>
    </div>
  );
}

/** Editor local: recorta en círculo, permite zoom y arrastre, y comprime a WebP. */
function CropEditor({
  src,
  pending,
  uploadError,
  onPreviewError,
  onCancel,
  onChooseAnother,
  onConfirm,
}: {
  src: string;
  pending: boolean;
  uploadError?: string;
  onPreviewError: () => void;
  onCancel: () => void;
  onChooseAnother: () => void;
  onConfirm: (file: File) => void;
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [cropSize, setCropSize] = useState(250);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [cropError, setCropError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const dragRef = useRef({ active: false, x: 0, y: 0 });
  const selectionDragRef = useRef({ active: false, x: 0, y: 0 });
  const resizeRef = useRef({ active: false, handle: "", x: 0, y: 0, size: 250 });

  const viewport = 320;

  function getLayout() {
    if (!dimensions.width || !dimensions.height) return null;
    const scale = Math.max(viewport / dimensions.width, viewport / dimensions.height);
    return {
      scale,
      width: dimensions.width * scale,
      height: dimensions.height * scale,
    };
  }

  function clampOffset(next: { x: number; y: number }) {
    const layout = getLayout();
    if (!layout) return next;
    return {
      x: Math.max(-Math.max(0, (layout.width - viewport) / 2), Math.min(Math.max(0, (layout.width - viewport) / 2), next.x)),
      y: Math.max(-Math.max(0, (layout.height - viewport) / 2), Math.min(Math.max(0, (layout.height - viewport) / 2), next.y)),
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { active: true, x: event.clientX, y: event.clientY };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (selectionDragRef.current.active) {
      const dx = event.clientX - selectionDragRef.current.x;
      const dy = event.clientY - selectionDragRef.current.y;
      selectionDragRef.current = { active: true, x: event.clientX, y: event.clientY };
      const limit = (viewport - cropSize) / 2;
      setCropPosition((current) => ({
        x: Math.max(-limit, Math.min(limit, current.x + dx)),
        y: Math.max(-limit, Math.min(limit, current.y + dy)),
      }));
      return;
    }
    if (resizeRef.current.active) {
      const { handle, x, y, size } = resizeRef.current;
      const dx = event.clientX - x;
      const dy = event.clientY - y;
      const delta = handle === "top-left" ? -(dx + dy) / 2
        : handle === "top-right" ? (dx - dy) / 2
          : handle === "bottom-left" ? (-dx + dy) / 2
            : (dx + dy) / 2;
      const nextSize = Math.max(150, Math.min(310, size + delta));
      setCropSize(nextSize);
      const limit = (viewport - nextSize) / 2;
      setCropPosition((current) => ({
        x: Math.max(-limit, Math.min(limit, current.x)),
        y: Math.max(-limit, Math.min(limit, current.y)),
      }));
      return;
    }
    if (!dragRef.current.active) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    dragRef.current = { active: true, x: event.clientX, y: event.clientY };
    setOffset((current) => clampOffset({ x: current.x + dx, y: current.y + dy }));
  }

  function stopDragging() {
    dragRef.current.active = false;
    selectionDragRef.current.active = false;
    resizeRef.current.active = false;
  }

  function startSelectionDrag(event: React.PointerEvent<HTMLDivElement>) {
    event.stopPropagation();
    event.preventDefault();
    selectionDragRef.current = { active: true, x: event.clientX, y: event.clientY };
  }

  function startResizing(event: React.PointerEvent<HTMLButtonElement>, handle: string) {
    event.stopPropagation();
    resizeRef.current = {
      active: true,
      handle,
      x: event.clientX,
      y: event.clientY,
      size: cropSize,
    };
  }

  async function createCroppedFile() {
    const image = imageRef.current;
    const layout = getLayout();
    if (!image || !layout) return;

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("2d");
    if (!context) return;

    const sourceSize = cropSize / layout.scale;
    const sourceX = (image.naturalWidth - sourceSize) / 2 + (cropPosition.x - offset.x) / layout.scale;
    const sourceY = (image.naturalHeight - sourceSize) / 2 + (cropPosition.y - offset.y) / layout.scale;
    context.drawImage(
      image,
      Math.max(0, sourceX),
      Math.max(0, sourceY),
      Math.min(sourceSize, image.naturalWidth),
      Math.min(sourceSize, image.naturalHeight),
      0,
      0,
      512,
      512,
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.82),
    );
    if (!blob) {
      setCropError("No se pudo preparar la imagen. Prueba con otra foto o formato.");
      return;
    }
    if (blob.size > 2 * 1024 * 1024) {
      setCropError("La imagen editada supera 2 MB. Reduce el zoom o elige otra foto.");
      return;
    }
    setCropError(null);
    onConfirm(new File([blob], "avatar.webp", { type: "image/webp" }));
  }

  const layout = getLayout();

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        Mueve la imagen y ajusta el círculo para encuadrarla. Se guardará en formato cuadrado y se mostrará circularmente.
      </p>
      {!imageError && (
        <div
          className="relative mx-auto h-80 w-full max-w-[320px] touch-none overflow-hidden rounded-xl bg-ink"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          role="application"
          aria-label="Editor de recorte de foto"
        >
          {/* La imagen queda debajo de la máscara circular para que el área final sea evidente. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={src}
            alt="Vista previa de la foto"
            onLoad={(event) => {
              setCropError(null);
              setImageError(false);
              setDimensions({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              });
            }}
            onError={() => {
              setImageError(true);
              setCropError("No se pudo cargar la vista previa de esta imagen.");
              onPreviewError();
            }}
            draggable={false}
            className="pointer-events-none absolute max-w-none select-none"
            style={layout ? {
              width: layout.width,
              height: layout.height,
              left: `calc(50% - ${layout.width / 2}px + ${offset.x}px)`,
              top: `calc(50% - ${layout.height / 2}px + ${offset.y}px)`,
            } : {
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(circle ${cropSize / 2}px at calc(50% + ${cropPosition.x}px) calc(50% + ${cropPosition.y}px), transparent calc(${cropSize / 2}px - 1px), rgba(13, 37, 59, 0.35) ${cropSize / 2}px)`,
            }}
          />
          <div
            className="absolute cursor-move rounded-full border border-dashed border-white"
            style={{
              width: cropSize,
              height: cropSize,
              left: `calc(50% + ${cropPosition.x}px)`,
              top: `calc(50% + ${cropPosition.y}px)`,
              transform: "translate(-50%, -50%)",
            }}
            onPointerDown={startSelectionDrag}
            data-crop-selection
            role="application"
            aria-label="Mover área de recorte"
          />
          {[
            ["top-left", `calc(50% + ${cropPosition.x - cropSize / 2}px)`, `calc(50% + ${cropPosition.y - cropSize / 2}px)`],
            ["top-right", `calc(50% + ${cropPosition.x + cropSize / 2}px)`, `calc(50% + ${cropPosition.y - cropSize / 2}px)`],
            ["bottom-left", `calc(50% + ${cropPosition.x - cropSize / 2}px)`, `calc(50% + ${cropPosition.y + cropSize / 2}px)`],
            ["bottom-right", `calc(50% + ${cropPosition.x + cropSize / 2}px)`, `calc(50% + ${cropPosition.y + cropSize / 2}px)`],
          ].map(([handle, left, top]) => (
            <button
              key={handle}
              type="button"
              aria-label={`Ajustar recorte ${handle}`}
              onPointerDown={(event) => startResizing(event, handle)}
              className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-muted bg-white shadow-sm"
              style={{ left, top }}
            />
          ))}
        </div>
      )}
      {imageError ? (
        <div className="rounded-xl border border-coral/30 bg-coral/10 p-4 text-center">
          <p role="alert" className="text-sm text-coral">
            No pudimos preparar esta imagen para editarla. Prueba con una imagen JPG, PNG o WEBP válida.
          </p>
          <button type="button" onClick={onChooseAnother} className={buttonClasses({ variant: "secondary", size: "sm" })}>
            Elegir otra imagen
          </button>
        </div>
      ) : (
        <>
          {uploadError && (
            <p role="alert" className="rounded-lg border border-coral/30 bg-coral/10 p-3 text-sm text-coral">
              {uploadError}
            </p>
          )}
          <p className="text-xs text-muted">Arrastra el círculo para moverlo, la imagen para encuadrarla y usa los puntos blancos para ajustar su tamaño.</p>
          {cropError && (
            <p role="alert" className="text-sm text-coral">
              {cropError}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onCancel} disabled={pending} className={buttonClasses({ variant: "secondary", size: "sm" })}>
              Cancelar
            </button>
            <button type="button" onClick={createCroppedFile} disabled={pending || !layout} className={buttonClasses({ variant: "primary", size: "sm" })}>
              {pending ? "Subiendo…" : "Guardar foto"}
            </button>
          </div>
        </>
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
