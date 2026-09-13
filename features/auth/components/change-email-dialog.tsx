"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChangeEmailForm } from "./change-email-form";

/** Botón "Cambiar correo" en un modal, mismo patrón que ChangePasswordDialog. */
export function ChangeEmailDialog({ currentEmail }: { currentEmail: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(buttonClasses({ variant: "outline", size: "sm" }), "mt-4")}
      >
        Cambiar correo
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Cambiar correo">
        <ChangeEmailForm currentEmail={currentEmail} />
      </Modal>
    </>
  );
}
