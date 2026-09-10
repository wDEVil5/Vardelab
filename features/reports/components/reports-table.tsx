"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Report, ReportTarget } from "@/features/reports/queries";

export type ReportRow = Report & { target: ReportTarget };

const ESTADO: Record<string, { label: string; tone: BadgeTone }> = {
  abierto: { label: "Abierto", tone: "brand" },
  en_revision: { label: "En revisión", tone: "outline" },
  resuelto: { label: "Resuelto", tone: "success" },
};

type FiltroId = "abiertos" | "en_revision" | "resueltos" | "todos";

const FILTROS: { id: FiltroId; label: string }[] = [
  { id: "abiertos", label: "Abiertos" },
  { id: "en_revision", label: "En revisión" },
  { id: "resueltos", label: "Resueltos" },
  { id: "todos", label: "Todos" },
];

function coincide(status: string, f: FiltroId): boolean {
  if (f === "todos") return true;
  if (f === "abiertos") return status === "abierto";
  if (f === "en_revision") return status === "en_revision";
  return status === "resuelto";
}

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
 */
export function ReportsTable({ reports }: { reports: ReportRow[] }) {
  const [filtro, setFiltro] = useState<FiltroId>("abiertos");
  const visibles = reports.filter((r) => coincide(r.status, filtro));
  const conteo = (f: FiltroId) =>
    reports.filter((r) => coincide(r.status, f)).length;

  return (
    <div className="flex flex-col gap-4">
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
            {reports.length === 0
              ? "No hay reportes todavía."
              : "No hay reportes en este estado."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {visibles.map((report) => {
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
                  <Badge tone={estado.tone}>{estado.label}</Badge>
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
