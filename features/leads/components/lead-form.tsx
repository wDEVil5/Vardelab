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

type LeadCopy = {
  /** Si falta, el form arranca directo en los campos (útil cuando la página ya hizo el pitch). */
  intro?: { titulo: string; texto: string };
  organizacionLabel: string;
  organizacionHint?: string;
  organizacionPlaceholder: string;
  /** Solo visual: el campo sigue sin `required` para no friccionar. */
  organizacionOptional?: boolean;
  mensajeLabel: string;
  mensajePlaceholder: string;
  submit: string;
  privacy: string;
};

const COPY: Record<LeadTipo, LeadCopy> = {
  contacto_organizacion: {
    // Sin intro: el pitch vive en la columna izquierda de /contacto.
    organizacionLabel: "Organización",
    organizacionOptional: true,
    organizacionPlaceholder: "Nombre de la organización",
    mensajeLabel: "¿Qué necesitas resolver?",
    mensajePlaceholder:
      'Ej.: "Tenemos datos de ventas, pero no sabemos qué productos se mueven más."',
    submit: "Enviar consulta",
    privacy: "Usaremos estos datos solo para responder a tu consulta.",
  },
  propuesta_desafio: {
    // Sin intro: el pitch vive en la columna izquierda de /proponer.
    organizacionLabel: "Organización",
    organizacionHint: "Nombre o cómo la conoces. Si no lo tienes claro, descríbela en el desafío.",
    organizacionPlaceholder: "Ej.: feria del barrio, pyme de un familiar",
    mensajeLabel: "¿Qué desafío propones?",
    mensajePlaceholder:
      'Ej.: "No saben qué productos se mueven más y quieren ordenar sus ventas."',
    submit: "Enviar propuesta",
    privacy: "Usaremos estos datos solo para responder a tu propuesta.",
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
      <div className="rounded-2xl border border-sprout/30 bg-sprout/5 p-6 text-center sm:p-8">
        <p className="text-lg font-semibold text-ink">
          ¡Gracias! Recibimos tu mensaje.
        </p>
        <p className="mt-2 text-sm text-muted">
          Lo revisaremos y te escribiremos al correo que dejaste. En esta etapa
          piloto respondemos de forma personal.
        </p>
        <Link
          href="/proyectos"
          className="group mt-6 inline-flex items-center text-sm font-medium text-electric hover:underline"
        >
          Mientras tanto, explora los proyectos
          <span
            aria-hidden
            className="ml-0.5 inline-block transition-transform group-hover:translate-x-0.5"
          >
            →
          </span>
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 sm:gap-5">
      <input type="hidden" name="tipo" value={tipo} />

      {copy.intro && (
        <div>
          <h2 className="text-lg font-semibold text-ink">{copy.intro.titulo}</h2>
          <p className="mt-1 text-sm text-muted">{copy.intro.texto}</p>
        </div>
      )}

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
          {copy.organizacionLabel}
          {copy.organizacionOptional ? (
            <span className="text-muted"> (opcional)</span>
          ) : null}
        </span>
        {copy.organizacionHint ? (
          <span className="text-xs text-muted">{copy.organizacionHint}</span>
        ) : null}
        <Input
          name="organizacion"
          placeholder={copy.organizacionPlaceholder}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">{copy.mensajeLabel}</span>
        <Textarea
          name="mensaje"
          required
          maxLength={2000}
          placeholder={copy.mensajePlaceholder}
          className="min-h-28"
        />
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-coral">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="Enviando…">{copy.submit}</SubmitButton>
      <p className="text-xs text-muted">{copy.privacy}</p>
    </form>
  );
}
