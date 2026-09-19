"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SponsorProfileForm } from "./sponsor-profile-form";
import type { ProfileLinks } from "@/features/profile/queries";

/** Igual que `EditProfileDialog`, pero abre `SponsorProfileForm`. */
export function EditSponsorProfileDialog({
  nombre,
  cargo,
  bio,
  enlaces,
}: {
  nombre: string;
  cargo: string | null;
  bio: string | null;
  enlaces: ProfileLinks;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Editar perfil público"
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
      <Modal open={open} onClose={() => setOpen(false)} title="Editar perfil público">
        <SponsorProfileForm nombre={nombre} cargo={cargo} bio={bio} enlaces={enlaces} />
      </Modal>
    </>
  );
}
