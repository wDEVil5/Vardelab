"use client";

import { buttonClasses } from "@/components/ui/button";
import type { PilotMetrics } from "@/features/admin/queries";

/** Resumen de métricas como CSV — mismo patrón que la exportación de auditoría. */
function aCsv(m: PilotMetrics): string {
  const filas: [string, string][] = [
    ["Publicados", String(m.publicados)],
    ["Completados", String(m.completados)],
    ["Equipos formados", String(m.equiposFormados)],
    ["Evidencias de portafolio", String(m.evidenciasPortafolio)],
    ...m.porEstado.map((e): [string, string] => [`Proyectos · ${e.etiqueta}`, String(e.total)]),
    ["Postulaciones totales", String(m.postulaciones.total)],
    ["Postulaciones aceptadas", String(m.postulaciones.aceptadas)],
    ["Hitos totales", String(m.hitos.total)],
    ["Hitos aprobados", String(m.hitos.aprobados)],
    ["Reportes abiertos", String(m.reportes.abiertos)],
    ["Reportes resueltos", String(m.reportes.resueltos)],
  ];
  const escapar = (v: string) => `"${v.replaceAll('"', '""')}"`;
  return [["Métrica", "Valor"], ...filas]
    .map((fila) => fila.map(escapar).join(","))
    .join("\n");
}

function exportarCsv(m: PilotMetrics) {
  const blob = new Blob([aCsv(m)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `metricas-piloto-campuslab-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportMetricsButton({ metrics }: { metrics: PilotMetrics }) {
  return (
    <button
      type="button"
      onClick={() => exportarCsv(metrics)}
      className={buttonClasses({ variant: "primary", size: "md" })}
    >
      Exportar
    </button>
  );
}
