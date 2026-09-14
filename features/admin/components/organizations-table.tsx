"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import type { AdminOrgRow } from "@/features/admin/queries";

const VERIFICACION_TONE: Record<string, BadgeTone> = {
  verificado: "success",
  en_revision: "brand",
  sin_verificar: "neutral",
};

const FORMATO_FECHA = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/**
 * Tabla de organizaciones (D-01/D-03, hallazgo de los badges de verificado):
 * mismo patrón de filtros en memoria que el resto del panel admin. Abre en
 * "Todas" (no pre-filtrada a "En revisión"): con cero pendientes, filtrar de
 * entrada dejaría la tabla vacía sin explicación. El aviso de arriba ya
 * apunta a la cola real cuando existe.
 */
export function OrganizationsTable({ orgs }: { orgs: AdminOrgRow[] }) {
  const [query, setQuery] = useState("");
  const [filtroVerificacion, setFiltroVerificacion] = useState("todos");

  const visibles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orgs.filter((o) => {
      if (filtroVerificacion !== "todos" && o.verificacion !== filtroVerificacion) return false;
      if (!q) return true;
      return o.nombre.toLowerCase().includes(q);
    });
  }, [orgs, query, filtroVerificacion]);

  const pendientes = orgs.filter((o) => o.verificacion === "en_revision").length;

  return (
    <div className="flex flex-col gap-6">
      {pendientes > 0 && (
        <div className="rounded-2xl border border-electric/20 bg-electric/5 px-5 py-4 text-sm text-ink">
          <span className="font-medium">
            {pendientes} {pendientes === 1 ? "organización" : "organizaciones"}
          </span>{" "}
          esperando verificación.
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre"
          aria-label="Buscar por nombre"
          className="h-11 flex-1 rounded-lg border border-border bg-white px-4 text-sm text-ink placeholder:text-muted focus:border-electric focus:outline-none"
        />
        <Select
          value={filtroVerificacion}
          onChange={(e) => setFiltroVerificacion(e.target.value)}
          aria-label="Filtrar por verificación"
          className="sm:w-48"
        >
          <option value="todos">Todas</option>
          <option value="en_revision">En revisión</option>
          <option value="verificado">Verificadas</option>
          <option value="sin_verificar">Sin verificar</option>
        </Select>
      </div>

      {visibles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
          <p className="text-sm text-muted">
            {orgs.length === 0
              ? "Todavía no hay organizaciones."
              : "Ninguna organización coincide con la búsqueda."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="w-full min-w-160 text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="px-8 py-5 font-medium">Organización</th>
                <th className="px-8 py-5 font-medium">Tipo</th>
                <th className="px-8 py-5 font-medium">Verificación</th>
                <th className="px-8 py-5 font-medium">Creada</th>
                <th className="px-8 py-5 font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((o) => (
                <tr key={o.id} className="border-b border-border/60 last:border-0">
                  <td className="px-8 py-6 font-medium text-ink">{o.nombre}</td>
                  <td className="px-8 py-6 text-muted">{o.etiquetaTipo}</td>
                  <td className="px-8 py-6">
                    <Badge tone={VERIFICACION_TONE[o.verificacion] ?? "neutral"}>
                      {o.etiquetaVerificacion}
                    </Badge>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-muted">
                    {FORMATO_FECHA.format(new Date(o.createdAt))}
                  </td>
                  <td className="px-8 py-6">
                    <Link
                      href={`/admin/organizaciones/${o.id}`}
                      className="text-sm font-medium text-electric hover:underline"
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
