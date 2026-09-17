"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { Pagination } from "@/components/pagination";
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
 *
 * Filtro y paginación resueltos en el servidor (`?estado=`/`?page=`): antes
 * traía TODOS los leads y filtraba en memoria — con meses de captación
 * acumulada se vuelve una lista interminable.
 */
export function LeadsTable({
  leads,
  total,
  page,
  totalPages,
  estado: filtro,
  conteos,
}: {
  leads: Lead[];
  total: number;
  page: number;
  totalPages: number;
  estado: FiltroId;
  conteos: Record<string, number>;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Solo la lista scrollea (el resto de la pantalla queda fijo, ver
  // LeadsPage): reset del scroll al cambiar de página/filtro, y degradado de
  // abajo que avisa que hay más para scrollear.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hayMasAbajo, setHayMasAbajo] = useState(false);
  const chequearScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setHayMasAbajo(el.scrollHeight - el.scrollTop - el.clientHeight > 1);
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    requestAnimationFrame(chequearScroll);
  }, [page, filtro]);

  useEffect(() => {
    window.addEventListener("resize", chequearScroll);
    return () => window.removeEventListener("resize", chequearScroll);
  }, []);

  const hrefCon = (f: FiltroId) => (f === "nuevo" ? pathname : `${pathname}?estado=${f}`);
  const hrefForPage = (n: number) => {
    const sp = new URLSearchParams();
    if (filtro !== "nuevo") sp.set("estado", filtro);
    if (n > 1) sp.set("page", String(n));
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      {/* Filtros: control segmentado con contadores. */}
      <div
        role="group"
        aria-label="Filtrar por estado"
        className="inline-flex shrink-0 flex-wrap gap-1 self-start rounded-full bg-surface p-1"
      >
        {FILTROS.map((f) => {
          const activo = filtro === f.id;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={activo}
              onClick={() => router.push(hrefCon(f.id))}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                activo ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink",
              )}
            >
              {f.label}
              <span className="text-xs tabular-nums text-muted/70">
                {conteos[f.id] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {leads.length === 0 ? (
        <div className="shrink-0 rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
          <p className="text-sm text-muted">
            {total === 0
              ? "Todavía no llegó ningún lead."
              : "No hay leads en este estado."}
          </p>
        </div>
      ) : (
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-surface/60">
          <div ref={scrollRef} onScroll={chequearScroll} className="h-full overflow-y-auto p-3">
        <ul className="flex flex-col gap-3">
          {leads.map((lead) => {
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
          </div>
          {hayMasAbajo && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-ink/10 to-transparent"
            />
          )}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        hrefForPage={hrefForPage}
        label="Paginación de leads"
        className="shrink-0"
      />
    </div>
  );
}
