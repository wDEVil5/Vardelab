"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import type { AdminProjectRow } from "@/features/admin/queries";

const ESTADO_TONE: Record<string, BadgeTone> = {
  borrador: "neutral",
  en_revision: "brand",
  publicado: "success",
  seleccion: "brand",
  activo: "success",
  revision_final: "brand",
  completado: "success",
  suspendido: "danger",
  cancelado: "danger",
};

const FORMATO_FECHA = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/**
 * Tabla de proyectos del piloto (D-01, hallazgo de la revisión de métricas):
 * primera vez que el admin puede ver la lista completa, no solo agregados.
 * Mismo patrón de filtros en memoria que el resto del panel admin. Sin
 * acciones inline (a diferencia de `UsersTable`): cancelar exige contexto
 * completo del proyecto, así que vive en el detalle (`/admin/proyectos/[id]`),
 * no en una fila de tabla.
 */
export function ProjectsTable({ proyectos }: { proyectos: AdminProjectRow[] }) {
  const [query, setQuery] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const estados = useMemo(
    () => [...new Set(proyectos.map((p) => p.status))],
    [proyectos],
  );

  const visibles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return proyectos.filter((p) => {
      if (filtroEstado !== "todos" && p.status !== filtroEstado) return false;
      if (!q) return true;
      return (
        p.titulo.toLowerCase().includes(q) || p.orgNombre.toLowerCase().includes(q)
      );
    });
  }, [proyectos, query, filtroEstado]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por título o organización"
          aria-label="Buscar por título o organización"
          className="h-11 flex-1 rounded-lg border border-border bg-white px-4 text-sm text-ink placeholder:text-muted focus:border-electric focus:outline-none"
        />
        <Select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          aria-label="Filtrar por estado"
          className="sm:w-48"
        >
          <option value="todos">Todos los estados</option>
          {estados.map((e) => (
            <option key={e} value={e}>
              {proyectos.find((p) => p.status === e)?.etiquetaEstado ?? e}
            </option>
          ))}
        </Select>
      </div>

      {visibles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
          <p className="text-sm text-muted">
            {proyectos.length === 0
              ? "Todavía no hay proyectos."
              : "Ningún proyecto coincide con la búsqueda."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="w-full min-w-160 text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="px-8 py-5 font-medium">Proyecto</th>
                <th className="px-8 py-5 font-medium">Organización</th>
                <th className="px-8 py-5 font-medium">Estado</th>
                <th className="px-8 py-5 font-medium">Creado</th>
                <th className="px-8 py-5 font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((p) => (
                <tr key={p.id} className="border-b border-border/60 last:border-0">
                  <td className="px-8 py-6 font-medium text-ink">{p.titulo}</td>
                  <td className="px-8 py-6 text-muted">{p.orgNombre}</td>
                  <td className="px-8 py-6">
                    <Badge tone={ESTADO_TONE[p.status] ?? "neutral"}>
                      {p.etiquetaEstado}
                    </Badge>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-muted">
                    {FORMATO_FECHA.format(new Date(p.createdAt))}
                  </td>
                  <td className="px-8 py-6">
                    <Link
                      href={`/admin/proyectos/${p.id}`}
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
