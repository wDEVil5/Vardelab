"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import type { AdminUserRow } from "@/features/admin/queries";
import { UserRowActions } from "@/features/admin/components/user-row-actions";

const ROL_LABEL: Record<string, string> = {
  estudiante: "Estudiante",
  patrocinador: "Patrocinador",
  mentor: "Mentor",
  moderador: "Moderador",
  admin: "Admin",
};

const ROL_TONE: Record<string, BadgeTone> = {
  estudiante: "brand",
  patrocinador: "brand",
  mentor: "brand",
  moderador: "success",
  admin: "danger",
};

type FiltroRol = "todos" | "estudiante" | "patrocinador" | "mentor" | "moderador" | "admin";
type FiltroEstado = "todos" | "activo" | "suspendido";

// Cuántas filas se renderizan a la vez. Búsqueda/filtro siguen siendo en
// memoria sobre `users` completo (barato: son objetos livianos), pero
// renderizar las 3.000+ filas de golpe —cada una con selects y botones
// interactivos— es lo que de verdad se pone pesado y puede trabar la pestaña
// con volumen real (hallazgo de la prueba de carga). Paginar solo el render
// resuelve eso sin tocar la búsqueda/filtro que ya funcionaban bien.
const FILAS_POR_PAGINA = 30;

/**
 * Tabla de usuarios y permisos (D-03). Búsqueda y filtros en memoria (barato
 * sobre objetos livianos); el RENDER se pagina para no montar miles de filas
 * interactivas de golpe.
 *
 * `flex-1 min-h-0` + encabezado `sticky`: mismo patrón que `AuditLogTable`
 * (auditoría, D-04). El padre (`/admin/usuarios`) le da a este componente el
 * alto que sobra tras el encabezado y los KPIs; acá la tabla scrollea sola,
 * dejando "Acciones protegidas" siempre visible abajo en vez de lejos del
 * final si hubiera muchas cuentas.
 */
export function UsersTable({
  users,
  currentUserId,
}: {
  users: AdminUserRow[];
  currentUserId: string;
}) {
  const [query, setQuery] = useState("");
  const [filtroRol, setFiltroRol] = useState<FiltroRol>("todos");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");
  const [pagina, setPagina] = useState(1);

  const visibles = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtrados = users.filter((u) => {
      if (filtroRol !== "todos" && u.rolPrincipal !== filtroRol) return false;
      if (filtroEstado === "activo" && u.suspendido) return false;
      if (filtroEstado === "suspendido" && !u.suspendido) return false;
      if (!q) return true;
      return u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });
    // La propia cuenta queda fija arriba: es la fila que un admin va a buscar
    // primero para confirmar su propio rol antes de tocar el de alguien más.
    return filtrados.sort((a, b) =>
      a.id === currentUserId ? -1 : b.id === currentUserId ? 1 : 0,
    );
  }, [users, query, filtroRol, filtroEstado, currentUserId]);

  // Buscar/filtrar siempre vuelve a la página 1 del resultado — comparación
  // durante el render (no un efecto) para no encadenar renders de más.
  const [filtroPrevio, setFiltroPrevio] = useState({ query, filtroRol, filtroEstado });
  if (
    filtroPrevio.query !== query ||
    filtroPrevio.filtroRol !== filtroRol ||
    filtroPrevio.filtroEstado !== filtroEstado
  ) {
    setFiltroPrevio({ query, filtroRol, filtroEstado });
    setPagina(1);
  }

  const totalPaginas = Math.max(1, Math.ceil(visibles.length / FILAS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const filasRenderizadas = visibles.slice(
    (paginaActual - 1) * FILAS_POR_PAGINA,
    paginaActual * FILAS_POR_PAGINA,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <div className="flex shrink-0 flex-col gap-3 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o correo"
          aria-label="Buscar por nombre o correo"
          className="h-11 flex-1 rounded-lg border border-border bg-white px-4 text-sm text-ink placeholder:text-muted focus:border-electric focus:outline-none"
        />
        <Select
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value as FiltroRol)}
          aria-label="Filtrar por rol"
          className="sm:w-44"
        >
          <option value="todos">Todos los roles</option>
          {Object.entries(ROL_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
          aria-label="Filtrar por estado"
          className="sm:w-40"
        >
          <option value="todos">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="suspendido">Suspendidos</option>
        </Select>
      </div>

      {visibles.length === 0 ? (
        <div className="shrink-0 rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
          <p className="text-sm text-muted">Ningún usuario coincide con la búsqueda.</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-border bg-white">
          {/* `table-fixed` + un ancho por columna: con layout automático, un
              `min-width` en "Acciones" no alcanzaba — el navegador igual le
              robaba espacio a las columnas vecinas cuando "Suspender" pasaba
              a "Confirmar"/"Cancelar" (más ancho), corriendo toda la tabla.
              Con anchos fijos, cada columna ocupa siempre el mismo espacio
              sin importar qué fila esté en modo confirmación. */}
          <table className="w-full min-w-180 table-fixed text-left text-sm">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="w-[24%] px-8 py-5 font-medium">Usuario</th>
                <th className="w-[13%] px-8 py-5 font-medium">Rol</th>
                <th className="w-[13%] px-8 py-5 font-medium">Estado</th>
                {/* `text-right`: el contenido de esta columna (select +
                    botones) está alineado a la derecha (`items-end` en
                    `UserRowActions`) — con la columna ahora ancha para no
                    "descuadrar" la tabla, un título a la izquierda quedaba
                    lejos de donde en verdad está el contenido. */}
                <th className="w-[50%] px-8 py-5 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filasRenderizadas.map((u) => (
                <tr
                  key={u.id}
                  className={cn(
                    "border-b border-border/60 last:border-0",
                    u.id === currentUserId && "bg-electric/5",
                  )}
                >
                  <td className="px-8 py-6">
                    <p className="font-medium text-ink">
                      {u.nombre}
                      {u.id === currentUserId && (
                        <span className="ml-1.5 text-xs font-normal text-muted">(tu cuenta)</span>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-muted">{u.email}</p>
                  </td>
                  <td className="px-8 py-6">
                    {u.rolPrincipal ? (
                      <Badge tone={ROL_TONE[u.rolPrincipal]}>{ROL_LABEL[u.rolPrincipal]}</Badge>
                    ) : (
                      <Badge tone="neutral">Sin rol</Badge>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <Badge tone={u.suspendido ? "danger" : "success"}>
                      {u.suspendido ? "Suspendido" : "Activo"}
                    </Badge>
                  </td>
                  <td className="px-8 py-6">
                    <UserRowActions
                      userId={u.id}
                      rolActual={u.rolPrincipal}
                      suspendido={u.suspendido}
                      esUnoMismo={u.id === currentUserId}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPaginas > 1 && (
          <div className="flex shrink-0 items-center justify-between gap-3 text-sm text-muted">
            <p>
              {(paginaActual - 1) * FILAS_POR_PAGINA + 1}–
              {Math.min(paginaActual * FILAS_POR_PAGINA, visibles.length)} de {visibles.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                className="rounded-lg border border-border px-3 py-1.5 font-medium text-ink transition-colors hover:border-electric/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Anterior
              </button>
              <span className="tabular-nums">
                {paginaActual} / {totalPaginas}
              </span>
              <button
                type="button"
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
                className="rounded-lg border border-border px-3 py-1.5 font-medium text-ink transition-colors hover:border-electric/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
        </div>
      )}
    </div>
  );
}
