"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PatrocinadorProfileForm } from "./patrocinador-profile-form";

/**
 * Botón "Editar" para el nombre, en la versión mínima del perfil de
 * patrocinador. Mismo comportamiento que `EditProfileDialog` (estudiante): el
 * texto se despliega suave hacia la derecha al pasar el mouse, el ícono queda
 * siempre visible. `style={{ gap: 0 }}` anula el `gap-2` del botón base, que
 * si no dejaría un hueco fijo aunque el texto esté colapsado a ancho 0.
 */
export function EditPatrocinadorProfileDialog({ nombre }: { nombre: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Editar nombre"
        className={cn(buttonClasses({ variant: "ghost", size: "sm" }), "group")}
        style={{ gap: 0 }}
      >
        <svg
          viewBox="0 0 24 24"
          className="size-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
        <span className="ml-0 max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-out group-hover:ml-1.5 group-hover:max-w-16 group-hover:opacity-100">
          Editar
        </span>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Editar nombre">
        <PatrocinadorProfileForm nombre={nombre} />
      </Modal>
    </>
  );
}
