"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { buttonClasses } from "@/components/ui/button";
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClasses({ variant: "secondary", size: "sm" })}
      >
        Editar perfil
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Editar perfil">
        <ProfileForm profile={profile} />
      </Modal>
    </>
  );
}
