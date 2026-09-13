"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChangePasswordForm } from "./change-password-form";

/**
 * Botón "Cambiar contraseña" en un modal (S-XX): antes mandaba a
 * `/actualizar-contrasena`, una pantalla de auth de pantalla completa sin el
 * shell de la app — un salto brusco para algo que se resuelve en un formulario
 * chico. Mismo patrón que `EditProfileDialog`.
 */
export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(buttonClasses({ variant: "outline", size: "sm" }), "mt-4")}
      >
        Cambiar contraseña
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Cambiar contraseña">
        <ChangePasswordForm />
      </Modal>
    </>
  );
}
