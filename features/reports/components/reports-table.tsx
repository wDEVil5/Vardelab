"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Pagination } from "@/components/pagination";
import { cn } from "@/lib/utils";
import type { Report, ReportTarget } from "@/features/reports/queries";

export type ReportRow = Report & { target: ReportTarget };

const ESTADO: Record<string, { label: string; tone: BadgeTone }> = {
  abierto: { label: "Abierto", tone: "brand" },
  en_revision: { label: "En revisión", tone: "outline" },
  resuelto: { label: "Resuelto", tone: "success" },
};

type FiltroId = "abiertos" | "en_revision" | "resueltos" | "todos" | "escalados";

const FILTROS: { id: FiltroId; label: string }[] = [
  { id: "abiertos", label: "Abiertos" },
  { id: "en_revision", label: "En revisión" },
  { id: "resueltos", label: "Resueltos" },
  { id: "escalados", label: "Escalados" },
  { id: "todos", label: "Todos" },
];

// Tiempo relativo, sin ambigüedad.
function haceCuanto(iso: string): string {
  const horas = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (horas < 1) return "hace unos minutos";
  if (horas < 24) return `hace ${horas} ${horas === 1 ? "hora" : "horas"}`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias} ${dias === 1 ? "día" : "días"}`;
}

/**
 * Cola de reportes (M-03), filtrable por estado. Cada fila lleva a su pantalla
 * de detalle (M-04). Los destinos (proyecto/perfil) ya vienen resueltos desde
 * el servidor — un componente cliente no puede hacer esa consulta.
 *
 * Filtro y paginación resueltos en el servidor (`?estado=`/`?page=`): antes
 * traía TODOS los reportes históricos y filtraba en memoria.
 */
export function ReportsTable({
  reports,
  total,
  page,
  totalPages,
  filtro,
  conteos,
}: {
  reports: ReportRow[];
  total: number;
  page: number;
  totalPages: number;
  filtro: FiltroId;
  conteos: {
    todos: number;
    abiertos: number;
    en_revision: number;
    resueltos: number;
    escalados: number;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Solo la lista scrollea (el resto de la pantalla queda fijo, ver
  // ReportesPage): reset del scroll al cambiar de página/filtro, y
  // degradado de abajo que avisa que hay más para scrollear.
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

  const hrefCon = (f: FiltroId) => (f === "abiertos" ? pathname : `${pathname}?estado=${f}`);
  const hrefForPage = (n: number) => {
    const sp = new URLSearchParams();
    if (filtro !== "abiertos") sp.set("estado", filtro);
    if (n > 1) sp.set("page", String(n));
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
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
                {conteos[f.id]}
              </span>
            </button>
          );
        })}
      </div>

      {reports.length === 0 ? (
        <div className="shrink-0 rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
          <p className="text-sm text-muted">
            {total === 0
              ? "No hay reportes todavía."
              : "No hay reportes en este estado."}
          </p>
        </div>
      ) : (
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-surface/60">
          <div ref={scrollRef} onScroll={chequearScroll} className="h-full overflow-y-auto p-3">
            <ul className="flex flex-col gap-3">
              {reports.map((report) => {
                const estado = ESTADO[report.status] ?? {
                  label: report.status,
                  tone: "neutral" as BadgeTone,
                };
                return (
                  <li key={report.id}>
                    <Link
                      href={`/moderacion/reportes/${report.id}`}
                      className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5 transition-colors hover:border-electric/40"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink">
                          {report.target?.label ?? "Contenido eliminado"}
                        </p>
                        <p className="truncate text-sm text-muted">
                          {report.motivo} · {haceCuanto(report.created_at)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap justify-end gap-2">
                        <Badge tone={estado.tone}>{estado.label}</Badge>
                        {report.escalado_admin && <Badge tone="brand">Escalado</Badge>}
                      </div>
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
        label="Paginación de reportes"
        className="shrink-0"
      />
    </div>
  );
}
