"use client";

import { useActionState, useState } from "react";
import { deleteRole, type DeleteRoleState } from "@/features/projects/actions";
import { Button, buttonClasses } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

const INITIAL: DeleteRoleState = {};

/**
 * Botón "Eliminar" de un rol. Confirmación en modal (no inline): la tarjeta
 * del rol es angosta y "Sí, eliminar" + "Cancelar" ahí adentro quedaba
 * apretado, el texto se envolvía en dos líneas y se veía mal. El modal ya
 * trae su propia animación de apertura, trampa de foco y cierre con Escape
 * (`components/ui/modal.tsx`), así que no hace falta nada de eso acá.
 *
 * La RLS `project_roles_delete_manager` (M76) bloquea el borrado si el rol
 * tiene postulaciones activas; el error se muestra dentro del modal en vez
 * de fallar en silencio.
 */
export function DeleteRoleButton({
  roleId,
  projectId,
  nombreRol,
}: {
  roleId: string;
  projectId: string;
  nombreRol: string;
}) {
  const [state, formAction] = useActionState(deleteRole, INITIAL);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClasses({ variant: "outline-danger", size: "sm" })}
      >
        Eliminar
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Eliminar rol">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink">
            ¿Eliminar el rol <strong>{nombreRol}</strong>? Esta acción no se
            puede deshacer.
          </p>

          <form action={formAction} className="flex justify-end gap-2">
            <input type="hidden" name="roleId" value={roleId} />
            <input type="hidden" name="projectId" value={projectId} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={buttonClasses({ variant: "ghost", size: "sm" })}
            >
              Cancelar
            </button>
            <Button type="submit" variant="danger" size="sm">
              Sí, eliminar
            </Button>
          </form>

          {state.error && (
            <p role="alert" className="text-sm text-coral">
              {state.error}
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
