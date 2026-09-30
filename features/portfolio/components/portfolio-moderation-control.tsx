"use client";

import { useActionState, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  setPortfolioItemModeracion,
  type ModeracionPortfolioState,
} from "@/features/portfolio/actions";

const INITIAL: ModeracionPortfolioState = {};

/**
 * Control de moderación sobre una ficha de portafolio pública — solo se
 * renderiza para admin/moderador (ver `app/(site)/u/[id]/page.tsx`). Ocultar
 * exige un motivo (M105); reactivar es un solo paso, sin modal.
 */
export function PortfolioModerationControl({
  itemId,
  profileId,
  oculto,
  motivo,
}: {
  itemId: string;
  profileId: string;
  oculto: boolean;
  motivo: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(setPortfolioItemModeracion, INITIAL);

  if (oculto) {
    return (
      <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-coral/10 px-3 py-2">
        <Badge tone="danger">Oculta por moderación</Badge>
        {motivo && <span className="text-xs text-ink">{motivo}</span>}
        <form action={formAction} className="ml-auto">
          <input type="hidden" name="itemId" value={itemId} />
          <input type="hidden" name="profileId" value={profileId} />
          <input type="hidden" name="oculto" value="false" />
          <SubmitButton variant="outline" size="sm" pendingText="Reactivando…">
            Reactivar
          </SubmitButton>
        </form>
      </div>
    );
  }

  return (
    <>
      {/* `<button>` es inline-block por defecto: sin un contenedor de bloque
          quedaba pegado en la misma línea que el título de la ficha (`<span>`
          inline justo antes), en vez de bajar a su propia línea. */}
      <div className="mt-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs font-medium text-coral hover:underline"
        >
          Ocultar por moderación
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="¿Ocultar esta ficha?">
        {state.ok ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-ink">Listo, ya no se ve fuera de Vardelab.</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-electric hover:underline"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-5">
            <input type="hidden" name="itemId" value={itemId} />
            <input type="hidden" name="profileId" value={profileId} />
            <input type="hidden" name="oculto" value="true" />

            <p className="text-sm leading-relaxed text-ink">
              Deja de verse en el perfil público, aunque el estudiante la
              vuelva a marcar como pública. Solo admin o moderador pueden
              reactivarla.
            </p>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">Motivo</span>
              <textarea
                name="motivo"
                required
                rows={3}
                className="rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-electric"
                placeholder="Ej: expone datos internos del proyecto sin autorización"
              />
            </label>

            {state.error && (
              <p role="alert" className="text-sm text-coral">
                {state.error}
              </p>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface"
              >
                Cancelar
              </button>
              <SubmitButton variant="danger" className="min-h-11" pendingText="Ocultando…">
                Ocultar
              </SubmitButton>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
