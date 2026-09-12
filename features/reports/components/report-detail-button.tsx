"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { MyReport, ReportTarget } from "@/features/reports/queries";

const ESTADO: Record<string, { label: string; tone: BadgeTone }> = {
  abierto: { label: "Abierto", tone: "brand" },
  en_revision: { label: "En revisión", tone: "outline" },
  resuelto: { label: "Resuelto", tone: "success" },
};

// Fecha del reporte, sin ambigüedad.
function fecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Botón "Ver" de un reporte propio (S-08): abre el detalle en un modal — el
 * motivo, la descripción y la nota de resolución si ya se resolvió — sin salir
 * de "Mis reportes". No hay una página de detalle para quien reporta (esa
 * existe solo para moderador/admin en `/moderacion/reportes/[id]`).
 */
export function ReportDetailButton({
  report,
  target,
}: {
  report: MyReport;
  target: ReportTarget;
}) {
  const [open, setOpen] = useState(false);
  const estado = ESTADO[report.status] ?? {
    label: report.status,
    tone: "neutral" as BadgeTone,
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClasses({ variant: "outline", size: "sm" })}
      >
        Ver
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={report.motivo}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <Badge tone={estado.tone}>{estado.label}</Badge>
            <span className="text-xs text-muted">{fecha(report.created_at)}</span>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Destino
            </p>
            {target ? (
              <Link
                href={target.href}
                className="mt-1 inline-block text-sm font-medium text-electric hover:underline"
              >
                {target.label}
              </Link>
            ) : (
              <p className="mt-1 text-sm text-muted">Ya no está disponible.</p>
            )}
          </div>

          {report.descripcion && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Tu descripción
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-ink">
                {report.descripcion}
              </p>
            </div>
          )}

          {report.status === "resuelto" && (
            <div className="rounded-lg bg-sprout/10 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Resolución
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-ink">
                {report.resolucion ?? "Sin nota de resolución."}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
