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
          anclado en la esquina de la tarjeta, con un vacío enorme en el medio. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          buttonClasses({ variant: "ghost", size: "sm" }),
          "gap-1.5",
        )}
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
        Editar
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Editar perfil">
        <ProfileForm profile={profile} />
      </Modal>
    </>
  );
}
