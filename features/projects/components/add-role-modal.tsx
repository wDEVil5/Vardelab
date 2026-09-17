"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { AddRoleForm } from "@/features/projects/components/add-role-form";
import type { Skill } from "@/features/skills/queries";

/**
 * Botón "Agregar rol" que abre el formulario en un modal, en vez de dejarlo
 * siempre visible al pie de la lista de roles — con varios roles ya cargados,
 * ese formulario permanente empujaba todo hacia abajo sin aportar nada la
 * mayor parte del tiempo. Tras agregar muestra una confirmación y permite
 * cargar otro rol sin reabrir el modal.
 */
export function AddRoleModal({
  projectId,
  catalog,
}: {
  projectId: string;
  catalog: Skill[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Agregar rol"
        className="group flex h-9 shrink-0 items-center overflow-hidden rounded-full border border-electric bg-white text-electric transition-colors hover:bg-electric/5"
      >
        <span className="flex size-9 shrink-0 items-center justify-center">
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
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-300 ease-out group-hover:max-w-32 group-hover:pr-4 group-hover:opacity-100">
          Agregar rol
        </span>
      </button>

      <Modal open={open} busy={pending} onClose={() => setOpen(false)} title="Agregar un rol">
        <AddRoleForm projectId={projectId} catalog={catalog} onDone={() => setOpen(false)} onPendingChange={setPending} />
      </Modal>
    </>
  );
}
