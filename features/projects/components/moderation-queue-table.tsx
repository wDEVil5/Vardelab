"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { Pagination } from "@/components/pagination";
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
 * Cola de moderación (M-01, M81): buscador y filtro de modalidad resueltos en
 * el servidor vía `?q=`/`?modalidad=`/`?page=` — reemplaza el filtrado en
 * memoria de antes, que traía TODOS los proyectos en revisión. Cada fila
 * lleva a la pantalla de revisión dedicada (M-02).
 */
export function ModerationQueueTable({
  proyectos,
  total,
  page,
  totalPages,
  filters,
  conteos,
}: {
  proyectos: ProjectForReview[];
  total: number;
  page: number;
  totalPages: number;
  filters: { q?: string; modalidad?: string };
  conteos: { todas: number; remoto: number; presencial: number; hibrido: number };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Solo esta caja scrollea (el resto de la pantalla queda fijo, ver
  // ModeracionPage): reset del scroll al cambiar de página/filtro, y
  // degradado de abajo que avisa que hay más para scrollear.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hayMasAbajo, setHayMasAbajo] = useState(false);
  const chequearScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setHayMasAbajo(el.scrollHeight - el.scrollTop - el.clientHeight > 1);
  };

  const qActual = filters.q ?? "";
  const [query, setQuery] = useState(qActual);
  const [qPrevio, setQPrevio] = useState(qActual);
  if (qActual !== qPrevio) {
    setQPrevio(qActual);
    setQuery(qActual);
  }

  useEffect(() => {
    if (query === qActual) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(Array.from(params.entries()));
      if (query.trim()) next.set("q", query);
      else next.delete("q");
      next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 250);
    return () => clearTimeout(t);
  }, [query, qActual, params, pathname, router]);

  const filtro: FiltroId = (filters.modalidad as FiltroId) || "todas";

  const onFiltroChange = (f: FiltroId) => {
    const next = new URLSearchParams(Array.from(params.entries()));
    if (f !== "todas") next.set("modalidad", f);
    else next.delete("modalidad");
    next.delete("page");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const hrefForPage = (n: number) => {
    const sp = new URLSearchParams();
    if (filters.q) sp.set("q", filters.q);
    if (filters.modalidad) sp.set("modalidad", filters.modalidad);
    if (n > 1) sp.set("page", String(n));
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    requestAnimationFrame(chequearScroll);
  }, [page, filters.q, filters.modalidad]);

  useEffect(() => {
    window.addEventListener("resize", chequearScroll);
    return () => window.removeEventListener("resize", chequearScroll);
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {/* Buscador */}
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar proyecto u organización"
        aria-label="Buscar proyecto u organización"
        className="h-11 shrink-0 rounded-xl border border-border bg-white px-4 text-sm text-ink placeholder:text-muted focus:border-electric focus:outline-none"
      />

      {/* Filtro por modalidad: control segmentado, como en el resto de la app. */}
      <div
        role="group"
        aria-label="Filtrar por modalidad"
        className="inline-flex shrink-0 flex-wrap gap-1 self-start rounded-full bg-surface p-1"
      >
        {FILTROS.map((f) => {
          const activo = filtro === f.id;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={activo}
              onClick={() => onFiltroChange(f.id)}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                activo ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink",
              )}
            >
              {f.label}
              <span className="text-xs tabular-nums text-muted/70">
                {conteos[f.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Lista */}
      {proyectos.length === 0 ? (
        <div className="shrink-0 rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
          <p className="text-sm text-muted">
            {total === 0
              ? "No hay nada por revisar."
              : "Ningún proyecto coincide con la búsqueda."}
          </p>
        </div>
      ) : (
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-surface/60">
          <div ref={scrollRef} onScroll={chequearScroll} className="h-full overflow-y-auto p-3">
            <ul className="flex flex-col gap-3">
              {proyectos.map((p) => {
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
                        <p className="truncate font-semibold text-ink">{p.titulo}</p>
                        {p.organization && (
                          <span className="flex min-w-0 items-center gap-1.5 text-sm text-muted">
                            <span className="truncate">{p.organization.nombre}</span>
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
        label="Paginación de la cola de moderación"
        className="shrink-0"
      />
    </div>
  );
}
