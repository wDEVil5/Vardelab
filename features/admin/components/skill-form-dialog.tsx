"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createSkill, updateSkill, type CatalogState } from "@/features/admin/actions";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/features/auth/components/submit-button";

const INITIAL: CatalogState = {};

/**
 * Diálogo compartido para crear o editar una habilidad — mismo formulario,
 * distinta Server Action según haya o no `skill`. Se cierra solo al terminar
 * bien: `state !== INITIAL` es verdadero solo después de un envío real (la
 * action devuelve un objeto nuevo). No un `ref` que se marca "ya hubo un
 * envío" dentro del propio efecto — ese patrón se rompe con el doble-invocado
 * de efectos de React Strict Mode en desarrollo (mount → cleanup → mount): la
 * segunda invocación veía la ref ya en `true` desde la primera y cerraba el
 * modal de inmediato, antes de que existiera ningún envío real.
 */
export function SkillFormDialog({
  trigger,
  triggerClassName,
  skill,
}: {
  trigger: string;
  triggerClassName?: string;
  skill?: { id: string; nombre: string; categoria: string };
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(skill ? updateSkill : createSkill, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state !== INITIAL && !state.error) {
      queueMicrotask(() => setOpen(false));
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClassName}>
        {trigger}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={skill ? "Editar habilidad" : "Agregar habilidad"}
      >
        <form ref={formRef} action={formAction} className="flex flex-col gap-4">
          {skill && <input type="hidden" name="skillId" value={skill.id} />}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Nombre</span>
            <Input name="nombre" defaultValue={skill?.nombre} required maxLength={60} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Categoría</span>
            <Input name="categoria" defaultValue={skill?.categoria} required maxLength={40} />
          </label>
          {state.error && (
            <p role="alert" className="text-sm text-coral">
              {state.error}
            </p>
          )}
          <div>
            <SubmitButton pendingText={skill ? "Guardando…" : "Creando…"}>
              {skill ? "Guardar cambios" : "Agregar habilidad"}
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
