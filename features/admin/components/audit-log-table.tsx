"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { AuditLogEntry } from "@/features/admin/queries";

const ACCION_LABEL: Record<string, string> = {
  rol_actualizado: "Rol actualizado",
  cuenta_suspendida: "Cuenta suspendida",
  cuenta_reactivada: "Cuenta reactivada",
  catalogo_editado: "Catálogo editado",
};

const ACCION_TONE: Record<string, BadgeTone> = {
  rol_actualizado: "brand",
  cuenta_suspendida: "danger",
  cuenta_reactivada: "success",
  catalogo_editado: "outline",
};

const ROL_LABEL: Record<string, string> = {
  admin: "Admin",
  moderador: "Moderador",
  mentor: "Mentor",
  patrocinador: "Patrocinador",
  estudiante: "Estudiante",
};

function etiquetaAccion(accion: string): string {
  return ACCION_LABEL[accion] ?? accion.replaceAll("_", " ");
}

/** Lee un campo de texto de `metadata` (jsonb sin tipar) sin lanzar si falta. */
function leerCampo(metadata: unknown, campo: string): string | null {
  if (metadata && typeof metadata === "object" && campo in metadata) {
    const valor = (metadata as Record<string, unknown>)[campo];
    return typeof valor === "string" ? valor : null;
  }
  return null;
}

/** Frase legible del evento, para el panel de detalle — no todos son iguales. */
function describirEvento(e: AuditLogEntry): string {
  const entidad = e.entidadNombre ?? "un usuario";
  switch (e.accion) {
    case "rol_actualizado": {
      const rolNuevo = leerCampo(e.metadata, "rol_nuevo");
      const rolLabel = rolNuevo ? (ROL_LABEL[rolNuevo] ?? rolNuevo) : "otro rol";
      return `${e.actorNombre} cambió el rol de ${entidad} a ${rolLabel}.`;
    }
    case "cuenta_suspendida":
      return `${e.actorNombre} suspendió la cuenta de ${entidad}.`;
    case "cuenta_reactivada":
      return `${e.actorNombre} reactivó la cuenta de ${entidad}.`;
    case "catalogo_editado": {
      const tipo = leerCampo(e.metadata, "tipo");
      const nombre = leerCampo(e.metadata, "nombre");
      if (tipo === "categoria_renombrada") {
        const de = leerCampo(e.metadata, "categoria_de");
        const a = leerCampo(e.metadata, "categoria_a");
        return `${e.actorNombre} renombró la categoría "${de}" a "${a}".`;
      }
      const nombreHabilidad = nombre ?? entidad.replace(/^Habilidad: /, "");
      const verbo: Record<string, string> = {
        creada: "creó",
        editada: "editó",
        activada: "activó",
        desactivada: "desactivó",
      };
      return `${e.actorNombre} ${verbo[tipo ?? ""] ?? "modificó"} la habilidad "${nombreHabilidad}".`;
    }
    default:
      return `${e.actorNombre} registró "${etiquetaAccion(e.accion)}" sobre ${entidad}.`;
  }
}

type FiltroPeriodo = "todos" | "7" | "30" | "90";

const FORMATO_FECHA = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** Encabezados + filas como CSV, para "Exportar registro" (sin ir al servidor: los datos ya están en el navegador). */
function aCsv(eventos: AuditLogEntry[]): string {
  const encabezado = ["Evento", "Actor", "Entidad", "Fecha"];
  const filas = eventos.map((e) => [
    etiquetaAccion(e.accion),
    e.actorNombre,
    e.entidadNombre ?? e.entidad ?? "",
    e.created_at,
  ]);
  const escapar = (v: string) => `"${v.replaceAll('"', '""')}"`;
  return [encabezado, ...filas].map((fila) => fila.map(escapar).join(",")).join("\n");
}

function exportarCsv(eventos: AuditLogEntry[]) {
  const blob = new Blob([aCsv(eventos)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `auditoria-campuslab-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Tabla del registro de auditoría (D-04). Mismo patrón de filtros en memoria
 * que el resto del panel admin — a escala de piloto (cientos de eventos, no
 * miles) alcanza y sobra. Al hacer clic en "Ver" de una fila se abre, debajo
 * de la tabla, un resumen legible del evento (sin exponer IP ni metadata
 * cruda salvo que se pida explícitamente).
 */
export function AuditLogTable({ eventos }: { eventos: AuditLogEntry[] }) {
  const [query, setQuery] = useState("");
  const [filtroAccion, setFiltroAccion] = useState<string>("todas");
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>("todos");
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [verDatosTecnicos, setVerDatosTecnicos] = useState(false);
  // Captura "ahora" una sola vez al montar (no en cada filtro): evita llamar a
  // una función impura durante el render, que es lo que exige la regla de
  // pureza de React — un `useState` con inicializador es la vía sancionada.
  const [ahora] = useState(() => Date.now());

  const acciones = useMemo(
    () => [...new Set(eventos.map((e) => e.accion))],
    [eventos],
  );

  const visibles = useMemo(() => {
    const q = query.trim().toLowerCase();
    const limite =
      filtroPeriodo === "todos"
        ? null
        : ahora - Number(filtroPeriodo) * 24 * 60 * 60 * 1000;

    return eventos.filter((e) => {
      if (filtroAccion !== "todas" && e.accion !== filtroAccion) return false;
      if (limite !== null && new Date(e.created_at).getTime() < limite) return false;
      if (!q) return true;
      return (
        e.actorNombre.toLowerCase().includes(q) ||
        (e.entidadNombre ?? e.entidad ?? "").toLowerCase().includes(q)
      );
    });
  }, [eventos, query, filtroAccion, filtroPeriodo, ahora]);

  const eventoSeleccionado = eventos.find((e) => e.id === seleccionado) ?? null;

  function seleccionar(id: string) {
    setVerDatosTecnicos(false);
    setSeleccionado((actual) => (actual === id ? null : id));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por actor o entidad"
          aria-label="Buscar por actor o entidad"
          className="h-11 flex-1 rounded-lg border border-border bg-white px-4 text-sm text-ink placeholder:text-muted focus:border-electric focus:outline-none"
        />
        <Select
          value={filtroAccion}
          onChange={(e) => setFiltroAccion(e.target.value)}
          aria-label="Filtrar por acción"
          className="sm:w-48"
        >
          <option value="todas">Todas las acciones</option>
          {acciones.map((a) => (
            <option key={a} value={a}>
              {etiquetaAccion(a)}
            </option>
          ))}
        </Select>
        <Select
          value={filtroPeriodo}
          onChange={(e) => setFiltroPeriodo(e.target.value as FiltroPeriodo)}
          aria-label="Filtrar por período"
          className="sm:w-44"
        >
          <option value="todos">Todo el historial</option>
          <option value="7">Últimos 7 días</option>
          <option value="30">Últimos 30 días</option>
          <option value="90">Últimos 90 días</option>
        </Select>
        <button
          type="button"
          onClick={() => exportarCsv(visibles)}
          disabled={visibles.length === 0}
          className={buttonClasses({ variant: "primary", size: "md" })}
        >
          Exportar registro
        </button>
      </div>

      {visibles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
          <p className="text-sm text-muted">
            {eventos.length === 0
              ? "Todavía no hay eventos registrados."
              : "Ningún evento coincide con la búsqueda."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="w-full min-w-180 text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="px-8 py-5 font-medium">Evento</th>
                <th className="px-8 py-5 font-medium">Actor</th>
                <th className="px-8 py-5 font-medium">Entidad</th>
                <th className="px-8 py-5 font-medium">Fecha</th>
                <th className="px-8 py-5 font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((e) => (
                <tr
                  key={e.id}
                  className={cn(
                    "border-b border-border/60 last:border-0",
                    e.id === seleccionado && "bg-electric/5",
                  )}
                >
                  <td className="px-8 py-6">
                    <Badge tone={ACCION_TONE[e.accion] ?? "neutral"}>
                      {etiquetaAccion(e.accion)}
                    </Badge>
                  </td>
                  <td className="px-8 py-6 text-ink">
                    {e.actorRol && <span className="text-muted">{e.actorRol} · </span>}
                    {e.actorNombre}
                  </td>
                  <td className="px-8 py-6 text-ink">{e.entidadNombre ?? e.entidad ?? "—"}</td>
                  <td className="px-8 py-6 whitespace-nowrap text-muted">
                    {FORMATO_FECHA.format(new Date(e.created_at))}
                  </td>
                  <td className="px-8 py-6">
                    <button
                      type="button"
                      onClick={() => seleccionar(e.id)}
                      className="text-sm font-medium text-electric hover:underline"
                    >
                      {e.id === seleccionado ? "Ocultar" : "Ver →"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {eventoSeleccionado && (
        <div className="flex flex-col gap-4 rounded-2xl border border-electric/20 bg-electric/5 p-7 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="font-semibold text-ink">
              Evento seleccionado · {etiquetaAccion(eventoSeleccionado.accion)}
            </p>
            <p className="mt-1.5 text-sm text-ink">{describirEvento(eventoSeleccionado)}</p>
            <p className="mt-2.5 text-xs text-muted">IP y datos sensibles protegidos.</p>
            {verDatosTecnicos && (
              <pre className="mt-3 max-w-full overflow-x-auto rounded-lg bg-white p-3 text-xs text-muted">
                {JSON.stringify(
                  { entidad: eventoSeleccionado.entidad, metadata: eventoSeleccionado.metadata },
                  null,
                  2,
                )}
              </pre>
            )}
          </div>
          {(eventoSeleccionado.metadata || eventoSeleccionado.entidad) && (
            <button
              type="button"
              onClick={() => setVerDatosTecnicos((v) => !v)}
              className={buttonClasses({ variant: "outline", size: "sm" })}
            >
              {verDatosTecnicos ? "Ocultar datos técnicos" : "Ver datos técnicos"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
