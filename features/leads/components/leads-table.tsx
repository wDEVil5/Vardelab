"use client";

import { useState } from "react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";
import { updateLeadStatus } from "@/features/leads/actions";
import type { Lead } from "@/features/leads/queries";

// Tipo del lead → etiqueta legible.
const TIPO_LABEL: Record<string, string> = {
  contacto_organizacion: "Contacto",
  propuesta_desafio: "Propuesta",
};

// Estado del lead → etiqueta y tono del badge.
const ESTADO: Record<string, { label: string; tone: BadgeTone }> = {
  nuevo: { label: "Nuevo", tone: "brand" },
  contactado: { label: "Contactado", tone: "success" },
  descartado: { label: "Descartado", tone: "neutral" },
};

type FiltroId = "todos" | "nuevo" | "contactado" | "descartado";

const FILTROS: { id: FiltroId; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "nuevo", label: "Nuevos" },
  { id: "contactado", label: "Contactados" },
  { id: "descartado", label: "Descartados" },
];

function coincide(estado: string, filtro: FiltroId): boolean {
  return filtro === "todos" || estado === filtro;
}

// Fecha en términos relativos, sin ambigüedad.
function haceCuanto(iso: string): string {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dias <= 0) return "Hoy";
  if (dias === 1) return "Ayer";
  if (dias < 7) return `Hace ${dias} días`;
  if (dias < 30) return `Hace ${Math.floor(dias / 7)} sem`;
  const meses = Math.floor(dias / 30);
  return meses <= 1 ? "Hace 1 mes" : `Hace ${meses} meses`;
}

/**
 * Panel de gestión de leads (moderador/admin): filtro por estado y una tarjeta
 * por lead con sus datos y acciones para marcarlo contactado o descartado. La
 * RLS `leads_update_staff` (M17) es la garantía real; esto es solo la interfaz.
 */
export function LeadsTable({ leads }: { leads: Lead[] }) {
  const [filtro, setFiltro] = useState<FiltroId>("nuevo");
  const visibles = leads.filter((l) => coincide(l.estado, filtro));
  const conteo = (f: FiltroId) => leads.filter((l) => coincide(l.estado, f)).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Filtros: control segmentado con contadores. */}
      <div
        role="group"
        aria-label="Filtrar por estado"
        className="inline-flex flex-wrap gap-1 self-start rounded-full bg-surface p-1"
      >
        {FILTROS.map((f) => {
          const activo = filtro === f.id;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={activo}
              onClick={() => setFiltro(f.id)}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                activo ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink",
              )}
            >
              {f.label}
              <span className="text-xs tabular-nums text-muted/70">
                {conteo(f.id)}
              </span>
            </button>
          );
        })}
      </div>

      {visibles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
          <p className="text-sm text-muted">
            {leads.length === 0
              ? "Todavía no llegó ningún lead."
              : "No hay leads en este estado."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {visibles.map((lead) => {
            const estado = ESTADO[lead.estado] ?? {
              label: lead.estado,
              tone: "neutral" as BadgeTone,
            };
            return (
              <li
                key={lead.id}
                className="rounded-2xl border border-border bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink">{lead.nombre}</p>
                      <Badge tone="outline">
                        {TIPO_LABEL[lead.tipo] ?? lead.tipo}
                      </Badge>
                      <Badge tone={estado.tone}>{estado.label}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      <a
                        href={`mailto:${lead.email}`}
                        className="hover:text-electric hover:underline"
                      >
                        {lead.email}
                      </a>
                      {lead.organizacion && ` · ${lead.organizacion}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted">
                    {haceCuanto(lead.created_at)}
                  </span>
                </div>

                <p className="mt-3 whitespace-pre-line text-sm text-ink">
                  {lead.mensaje}
                </p>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                  {lead.estado !== "contactado" && (
                    <form action={updateLeadStatus}>
                      <input type="hidden" name="leadId" value={lead.id} />
                      <input type="hidden" name="estado" value="contactado" />
                      <SubmitButton
                        variant="secondary"
                        size="sm"
                        pendingText="Guardando…"
                      >
                        Marcar contactado
                      </SubmitButton>
                    </form>
                  )}
                  {lead.estado !== "descartado" && (
                    <form action={updateLeadStatus}>
                      <input type="hidden" name="leadId" value={lead.id} />
                      <input type="hidden" name="estado" value="descartado" />
                      <SubmitButton
                        variant="ghost"
                        size="sm"
                        pendingText="Guardando…"
                      >
                        Descartar
                      </SubmitButton>
                    </form>
                  )}
                  {lead.estado !== "nuevo" && (
                    <form action={updateLeadStatus}>
                      <input type="hidden" name="leadId" value={lead.id} />
                      <input type="hidden" name="estado" value="nuevo" />
                      <SubmitButton
                        variant="ghost"
                        size="sm"
                        pendingText="Guardando…"
                      >
                        Volver a nuevo
                      </SubmitButton>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
