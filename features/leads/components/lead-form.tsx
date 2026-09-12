"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/features/auth/components/submit-button";
import { submitLead, type SubmitLeadState } from "@/features/leads/actions";
import type { Database } from "@/types/database.types";

type LeadTipo = Database["public"]["Enums"]["lead_tipo"];

const INITIAL: SubmitLeadState = {};

// Textos que se adaptan según el origen del formulario. `intro` encabeza la
// tarjeta antes de los campos: hace que el formulario se sienta como el
// comienzo de una conversación, no un trámite genérico.
const COPY: Record<
  LeadTipo,
  {
    intro: { titulo: string; texto: string };
    mensajeLabel: string;
    mensajePlaceholder: string;
    submit: string;
  }
> = {
  contacto_organizacion: {
    intro: {
      titulo: "Cuéntanos lo esencial",
      texto: "No necesitas tener el desafío definido todavía.",
    },
    mensajeLabel: "¿Qué necesitas resolver?",
    mensajePlaceholder:
      'Ej.: "Tenemos datos de ventas, pero no sabemos qué productos se mueven más."',
    submit: "Enviar consulta",
  },
  propuesta_desafio: {
    intro: {
      titulo: "Cuéntanos lo esencial",
      texto: "No necesitas tener todos los detalles de la organización.",
    },
    mensajeLabel: "¿Qué desafío propones?",
    mensajePlaceholder:
      "Describe la organización y la necesidad que podría convertirse en un microproyecto.",
    submit: "Enviar propuesta",
  },
};

/**
 * Formulario de captación (Fase 1). Envía un lead mediante `submitLead` y, al
 * confirmarse, reemplaza el formulario por un acuse de recibo. El campo `tipo`
 * viaja oculto para distinguir contacto de propuesta en la misma tabla.
 */
export function LeadForm({ tipo }: { tipo: LeadTipo }) {
  const [state, formAction] = useActionState(submitLead, INITIAL);
  const copy = COPY[tipo];

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-sprout/30 bg-sprout/5 p-8 text-center">
        <p className="text-lg font-semibold text-ink">
          ¡Gracias! Recibimos tu mensaje.
        </p>
        <p className="mt-2 text-sm text-muted">
          Lo revisaremos y te escribiremos al correo que dejaste. En esta etapa
          piloto respondemos de forma personal.
        </p>
        <Link
          href="/proyectos"
          className="mt-6 inline-block text-sm font-medium text-electric hover:underline"
        >
          Mientras tanto, explora los proyectos →
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="tipo" value={tipo} />

      <div>
        <h2 className="text-lg font-semibold text-ink">{copy.intro.titulo}</h2>
        <p className="mt-1 text-sm text-muted">{copy.intro.texto}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Nombre</span>
          <Input name="nombre" required placeholder="Tu nombre" />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Correo</span>
          <Input
            type="email"
            name="email"
            required
            placeholder="tucorreo@ejemplo.cl"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">
          Organización <span className="text-muted">(opcional)</span>
        </span>
        <Input name="organizacion" placeholder="Nombre de la organización" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">{copy.mensajeLabel}</span>
        <Textarea
          name="mensaje"
          required
          maxLength={2000}
          placeholder={copy.mensajePlaceholder}
          className="min-h-32"
        />
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-coral">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="Enviando…">{copy.submit}</SubmitButton>
      <p className="text-xs text-muted">
        Usaremos estos datos solo para responder a tu consulta.
      </p>
    </form>
  );
}
