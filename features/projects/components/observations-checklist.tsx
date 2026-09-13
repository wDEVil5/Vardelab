"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ObservationToggle } from "@/features/projects/components/observation-toggle";

type Observacion = { id: string; categoria: string; texto: string; resuelta: boolean };

/**
 * Checklist de observaciones puntuales (S-07): cada una se puede marcar
 * resuelta con su propio interruptor, y el contador de arriba se actualiza al
 * toque (estado local, sin esperar la revalidación del servidor).
 */
export function ObservationsChecklist({
  projectId,
  observaciones,
}: {
  projectId: string;
  observaciones: Observacion[];
}) {
  const [resueltas, setResueltas] = useState(
    () => new Set(observaciones.filter((o) => o.resuelta).map((o) => o.id)),
  );

  const total = observaciones.length;
  const count = resueltas.size;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-ink">Observaciones</h2>
        <span className="text-sm text-muted">
          {count} de {total} {total === 1 ? "resuelta" : "resueltas"}
        </span>
      </div>

      <ul className="flex flex-col gap-3">
        {observaciones.map((o) => (
          <li
            key={o.id}
            className="flex items-start justify-between gap-4 rounded-xl bg-surface/60 p-4"
          >
            <div className="flex flex-col gap-1.5">
              <Badge tone="brand" className="w-fit">
                {o.categoria}
              </Badge>
              <p className="text-sm text-ink">{o.texto}</p>
            </div>
            <ObservationToggle
              observationId={o.id}
              projectId={projectId}
              resuelta={o.resuelta}
              onChange={(next) =>
                setResueltas((s) => {
                  const copy = new Set(s);
                  if (next) copy.add(o.id);
                  else copy.delete(o.id);
                  return copy;
                })
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
