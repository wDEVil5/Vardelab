"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { cn } from "@/lib/utils";
import type { ProjectForReview } from "@/features/projects/queries";

const MODALIDAD_LABEL: Record<string, string> = {
  remoto: "Remoto",
  presencial: "Presencial",
  hibrido: "Híbrido",
};

// Tono por modalidad: solo para diferenciarlas a simple vista, no implica
// "mejor/peor" (a diferencia de un semáforo de riesgo).
const MODALIDAD_TONE: Record<string, BadgeTone> = {
  remoto: "brand",
  presencial: "success",
  hibrido: "outline",
};

type FiltroId = "todas" | "remoto" | "presencial" | "hibrido";

const FILTROS: { id: FiltroId; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "remoto", label: "Remoto" },
  { id: "presencial", label: "Presencial" },
  { id: "hibrido", label: "Híbrido" },
];

// Conectores que no aportan a las iniciales del monograma.
const CONECTORES = new Set([
  "de", "del", "la", "el", "los", "las", "y", "en", "para", "por", "un", "una",
]);

function monograma(titulo: string): string {
  const palabras = titulo
    .trim()
    .split(/\s+/)
    .filter((w) => w && !CONECTORES.has(w.toLowerCase()));
  const base = palabras.length > 0 ? palabras : [titulo];
  return base.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "·";
}

/**
 * Cola de moderación (M-01): buscador en vivo por proyecto u organización, y un
 * filtro real por modalidad (no hay campo de "riesgo" en el modelo, así que no
 * se inventa uno). Cada fila lleva a la pantalla de revisión dedicada (M-02).
 */
export function ModerationQueueTable({
  proyectos,
}: {
  proyectos: ProjectForReview[];
}) {
  const [query, setQuery] = useState("");
  const [filtro, setFiltro] = useState<FiltroId>("todas");

  const visibles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return proyectos.filter((p) => {
      if (filtro !== "todas" && p.modalidad !== filtro) return false;
      if (!q) return true;
      return (
        p.titulo.toLowerCase().includes(q) ||
        (p.organization?.nombre ?? "").toLowerCase().includes(q)
      );
    });
  }, [proyectos, query, filtro]);

  const conteo = (f: FiltroId) =>
    proyectos.filter((p) => f === "todas" || p.modalidad === f).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Buscador */}
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar proyecto u organización"
        className="h-11 rounded-xl border border-border bg-white px-4 text-sm text-ink placeholder:text-muted focus:border-electric focus:outline-none"
      />

      {/* Filtro por modalidad: control segmentado, como en el resto de la app. */}
      <div
        role="group"
        aria-label="Filtrar por modalidad"
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

      {/* Lista */}
      {visibles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
          <p className="text-sm text-muted">
            {proyectos.length === 0
              ? "No hay nada por revisar."
              : "Ningún proyecto coincide con la búsqueda."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {visibles.map((p) => {
            const tone = p.modalidad ? MODALIDAD_TONE[p.modalidad] : "neutral";
            const label = p.modalidad
              ? MODALIDAD_LABEL[p.modalidad] ?? p.modalidad
              : "Por definir";
            return (
              <li key={p.id}>
                <Link
                  href={`/moderacion/${p.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5 transition-colors hover:border-electric/40"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-electric/10 text-base font-semibold text-electric">
                    {monograma(p.titulo)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">
                      {p.titulo}
                    </p>
                    {p.organization && (
                      <span className="flex items-center gap-1.5 truncate text-sm text-muted">
                        {p.organization.nombre}
                        {p.organization.verificacion === "verificado" && (
                          <VerifiedBadge />
                        )}
                      </span>
                    )}
                  </div>

                  <Badge tone={tone} className="shrink-0">
                    {label}
                  </Badge>

                  <span className="shrink-0 text-sm font-medium text-electric">
                    Revisar →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
