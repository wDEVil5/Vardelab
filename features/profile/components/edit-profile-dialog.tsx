"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProfileForm } from "./profile-form";
import type { MyProfile } from "@/features/profile/queries";

/**
 * Botón "Editar perfil" que abre el formulario de datos en un modal. Al guardar,
 * la Server Action redirige y la página se vuelve a renderizar: el modal se
 * cierra por sí solo (este componente se re-monta con el estado inicial).
 */
export function EditProfileDialog({ profile }: { profile: MyProfile }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Ghost + ícono, inline junto al nombre — antes era un botón de texto
          anclado en la esquina de la tarjeta, con un vacío enorme en el medio.
          El texto "Editar" se despliega suave hacia la derecha al pasar el
          mouse (ícono siempre visible); `style={{ gap: 0 }}` anula el `gap-2`
          del botón base — si no, el hueco fijo del gap quedaría siempre ahí,
          incluso con el texto colapsado a ancho 0. `aria-label` mantiene el
          botón anunciado igual para lectores de pantalla. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Editar perfil"
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
      <Modal open={open} onClose={() => setOpen(false)} title="Editar perfil">
        <ProfileForm profile={profile} />
      </Modal>
    </>
  );
}
