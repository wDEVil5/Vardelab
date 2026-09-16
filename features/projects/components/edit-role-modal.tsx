"use client";

import { useActionState, useEffect, useState } from "react";
import { updateRole, type UpdateRoleState } from "@/features/projects/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { buttonClasses } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type { ManagedProject } from "@/features/projects/queries";

const INITIAL: UpdateRoleState = {};

const SIN_SPINNERS =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

type Rol = ManagedProject["roles"][number];

const horasInicial = (rol: Rol) =>
  rol.horas_semanales != null ? String(rol.horas_semanales) : "";

/**
 * "Editar" un rol ya creado (antes solo se podía agregar/borrar, nunca
 * cambiar nombre/cupos/descripción/horas). Las habilidades no viven acá:
 * siguen editándose aparte con `RoleSkillsEditor`, inline en la tarjeta del
 * rol.
 *
 * El formulario (`RoleEditForm`) solo se monta mientras el modal está
 * abierto: así cada apertura arranca con estado fresco tomado de `rol`
 * (`useState(rol.nombre)` como valor inicial de un componente recién
 * montado) sin necesitar un efecto que "resincronice" campos — ese patrón
 * dispara `react-hooks/set-state-in-effect` y de paso es más código.
 */
export function EditRoleModal({
  rol,
  projectId,
}: {
  rol: Rol;
  projectId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClasses({ variant: "outline", size: "sm" })}
      >
        Editar
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Editar rol">
        {open && (
          <RoleEditForm rol={rol} projectId={projectId} onDone={() => setOpen(false)} />
        )}
      </Modal>
    </>
  );
}

function RoleEditForm({
  rol,
  projectId,
  onDone,
}: {
  rol: Rol;
  projectId: string;
  onDone: () => void;
}) {
  const [state, formAction] = useActionState(updateRole, INITIAL);

  const [nombre, setNombre] = useState(rol.nombre);
  const [cupos, setCupos] = useState(String(rol.cupos));
  const [horas, setHoras] = useState(horasInicial(rol));
  const [descripcion, setDescripcion] = useState(rol.descripcion ?? "");

  // `state !== INITIAL` es verdadero solo después de un envío real (el
  // action devuelve un objeto nuevo). A diferencia de una ref
  // "enviado.current" que se marca `true` en el propio efecto, esta
  // comparación no se confunde con el doble-invocado de efectos que hace
  // React Strict Mode en desarrollo (mount → cleanup → mount): con la ref,
  // esa segunda invocación veía `enviado.current` ya en `true` desde la
  // primera y disparaba `onDone()` de inmediato, cerrando el modal apenas
  // se abría.
  useEffect(() => {
    if (state !== INITIAL && !state.error) {
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const huboCambios =
    nombre !== rol.nombre ||
    cupos !== String(rol.cupos) ||
    horas !== horasInicial(rol) ||
    descripcion !== (rol.descripcion ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="roleId" value={rol.id} />
      <input type="hidden" name="projectId" value={projectId} />

      <div className="grid gap-4 sm:grid-cols-[1fr_6rem_11rem]">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Nombre del rol</span>
          <Input
            name="nombre"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Cupos</span>
          <Input
            type="number"
            name="cupos"
            min={1}
            value={cupos}
            onChange={(e) => setCupos(e.target.value)}
            className={cn("w-full", SIN_SPINNERS)}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">
            Horas/semana <span className="text-muted/70">(opcional)</span>
          </span>
          <Input
            type="number"
            name="horas_semanales"
            min={1}
            max={60}
            value={horas}
            onChange={(e) => setHoras(e.target.value)}
            placeholder="Ej: 10"
            className={cn("w-full", SIN_SPINNERS)}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">
          Descripción <span className="text-muted/70">(opcional)</span>
        </span>
        <Textarea
          name="descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Qué hace este rol en el proyecto"
          className="min-h-20"
        />
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-coral">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className={buttonClasses({ variant: "ghost", size: "sm" })}
        >
          Cancelar
        </button>
        <SubmitButton size="sm" pendingText="Guardando…" disabled={!huboCambios}>
          Guardar
        </SubmitButton>
      </div>
    </form>
  );
}
