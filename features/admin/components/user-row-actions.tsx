"use client";

import { useActionState, useState } from "react";
import {
  changeUserRole,
  suspendUser,
  reactivateUser,
  type AdminUsersState,
} from "@/features/admin/actions";
import { Button, buttonClasses } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";

const INITIAL: AdminUsersState = {};

const ROLES: { value: string; label: string }[] = [
  { value: "estudiante", label: "Estudiante" },
  { value: "patrocinador", label: "Patrocinador" },
  { value: "mentor", label: "Mentor" },
  { value: "moderador", label: "Moderador" },
  { value: "admin", label: "Admin" },
];

/**
 * Acciones de una fila del panel de usuarios: cambiar rol (select + botón, sin
 * confirmación porque no es destructivo y se puede revertir) y
 * suspender/reactivar (confirmación en modal: afecta la cuenta de otra
 * persona, así que vale la pena explicar qué implica antes de aplicarlo).
 *
 * No hace falta cerrar el modal manualmente al tener éxito: `UsersTable` le da
 * a esta fila `key={String(u.suspendido)}`, así que al cambiar ese estado el
 * componente se remonta entero y el modal vuelve a su valor inicial (cerrado).
 */
export function UserRowActions({
  userId,
  rolActual,
  suspendido,
  esUnoMismo,
}: {
  userId: string;
  rolActual: string | null;
  suspendido: boolean;
  esUnoMismo: boolean;
}) {
  const [roleState, roleAction] = useActionState(changeUserRole, INITIAL);
  const [suspendState, suspendAction] = useActionState(suspendUser, INITIAL);
  const [reactivateState, reactivateAction] = useActionState(reactivateUser, INITIAL);
  const [confirmando, setConfirmando] = useState<"suspender" | "reactivar" | null>(null);

  const error = roleState.error || suspendState.error || reactivateState.error;
  const accion = confirmando ?? (suspendido ? "reactivar" : "suspender");

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap items-center gap-3">
        <form action={roleAction} className="flex items-center gap-2">
          <input type="hidden" name="userId" value={userId} />
          <label className="sr-only" htmlFor={`rol-${userId}`}>
            Rol de {userId}
          </label>
          <Select
            id={`rol-${userId}`}
            name="rol"
            uiSize="sm"
            defaultValue={rolActual ?? "estudiante"}
            disabled={esUnoMismo}
            className="w-28"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
          <button
            type="submit"
            disabled={esUnoMismo}
            className={buttonClasses({ variant: "outline", size: "sm" })}
          >
            Guardar
          </button>
        </form>

        <div className="flex items-center gap-2 border-l border-border pl-3">
          <button
            type="button"
            onClick={() => setConfirmando(suspendido ? "reactivar" : "suspender")}
            disabled={!suspendido && esUnoMismo}
            className={buttonClasses({
              variant: suspendido ? "outline-primary" : "outline-danger",
              size: "sm",
            })}
          >
            {suspendido ? "Reactivar" : "Suspender"}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs text-coral">
          {error}
        </p>
      )}

      <Modal
        open={confirmando !== null}
        onClose={() => setConfirmando(null)}
        title={accion === "suspender" ? "¿Suspender esta cuenta?" : "¿Reactivar esta cuenta?"}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink">
            {accion === "suspender"
              ? "La persona no podrá iniciar sesión hasta que la reactives. Esto no borra sus datos."
              : "Vuelve a poder iniciar sesión de inmediato."}
          </p>

          <form
            action={accion === "suspender" ? suspendAction : reactivateAction}
            className="flex justify-end gap-2"
          >
            <input type="hidden" name="userId" value={userId} />
            <button
              type="button"
              onClick={() => setConfirmando(null)}
              className={buttonClasses({ variant: "ghost", size: "sm" })}
            >
              Cancelar
            </button>
            <Button type="submit" variant={accion === "suspender" ? "danger" : "primary"} size="sm">
              {accion === "suspender" ? "Sí, suspender" : "Sí, reactivar"}
            </Button>
          </form>
        </div>
      </Modal>
    </div>
  );
}
