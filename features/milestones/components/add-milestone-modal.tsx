"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { AddMilestoneForm } from "@/features/milestones/components/add-milestone-form";

/**
 * Botón "Agregar hito" que abre el formulario en un modal, en vez de dejarlo
 * siempre visible al pie del plan — con varios hitos ya cargados, ese
 * formulario permanente empujaba todo hacia abajo sin aportar nada la mayor
 * parte del tiempo (mismo criterio que `AddRoleModal`).
 */
export function AddMilestoneModal({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Agregar hito"
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
          Agregar hito
        </span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Agregar un hito">
        <AddMilestoneForm projectId={projectId} />
      </Modal>
    </>
  );
}
