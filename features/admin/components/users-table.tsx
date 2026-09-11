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

/**
 * Tabla de usuarios y permisos (D-03). Búsqueda y filtros en memoria — a
 * escala de piloto (decenas de cuentas) no hace falta paginar ni ir al
 * servidor por cada tecla.
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center">
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
        <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
          <p className="text-sm text-muted">Ningún usuario coincide con la búsqueda.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="w-full min-w-180 text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="px-8 py-5 font-medium">Usuario</th>
                <th className="px-8 py-5 font-medium">Rol</th>
                <th className="px-8 py-5 font-medium">Estado</th>
                <th className="px-8 py-5 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((u) => (
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
      )}
    </div>
  );
}
