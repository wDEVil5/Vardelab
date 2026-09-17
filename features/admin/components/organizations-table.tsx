"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/pagination";
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
 * Tabla de organizaciones (D-01/D-03, M80). Búsqueda y filtro de verificación
 * resueltos en el servidor vía `?q=`/`?verificacion=`/`?page=` — mismo
 * patrón que `ProjectsTable`: la lista llena el alto disponible con scroll
 * interno propio, la paginación queda pegada abajo, y el scroll de la caja
 * se resetea al cambiar de página.
 */
export function OrganizationsTable({
  orgs,
  total,
  page,
  totalPages,
  filters,
  pendientes,
}: {
  orgs: AdminOrgRow[];
  total: number;
  page: number;
  totalPages: number;
  filters: { q?: string; verificacion?: string };
  pendientes: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

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
  }, [page, filters.q, filters.verificacion]);

  useEffect(() => {
    window.addEventListener("resize", chequearScroll);
    return () => window.removeEventListener("resize", chequearScroll);
  }, []);

  const qActual = filters.q ?? "";
  const [query, setQuery] = useState(qActual);

  const [qPrevio, setQPrevio] = useState(qActual);
  if (qActual !== qPrevio) {
    setQPrevio(qActual);
    setQuery(qActual);
  }

  useEffect(() => {
    if (query === qActual) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(Array.from(params.entries()));
      if (query.trim()) next.set("q", query);
      else next.delete("q");
      next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 250);
    return () => clearTimeout(t);
  }, [query, qActual, params, pathname, router]);

  const onVerificacionChange = (value: string) => {
    const next = new URLSearchParams(Array.from(params.entries()));
    if (value !== "todos") next.set("verificacion", value);
    else next.delete("verificacion");
    next.delete("page");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const hrefForPage = (n: number) => {
    const sp = new URLSearchParams();
    if (filters.q) sp.set("q", filters.q);
    if (filters.verificacion) sp.set("verificacion", filters.verificacion);
    if (n > 1) sp.set("page", String(n));
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const filtrando = Boolean(filters.q || filters.verificacion);

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      {pendientes > 0 && (
        <div className="shrink-0 rounded-2xl border border-electric/20 bg-electric/5 px-5 py-4 text-sm text-ink">
          <span className="font-medium">
            {pendientes} {pendientes === 1 ? "organización" : "organizaciones"}
          </span>{" "}
          esperando verificación.
        </div>
      )}

      <div className="shrink-0 flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre"
          aria-label="Buscar por nombre"
          className="h-11 flex-1 rounded-lg border border-border bg-white px-4 text-sm text-ink placeholder:text-muted focus:border-electric focus:outline-none"
        />
        <Select
          value={filters.verificacion ?? "todos"}
          onChange={(e) => onVerificacionChange(e.target.value)}
          aria-label="Filtrar por verificación"
          className="sm:w-48"
        >
          <option value="todos">Todas</option>
          <option value="en_revision">En revisión</option>
          <option value="verificado">Verificadas</option>
          <option value="sin_verificar">Sin verificar</option>
        </Select>
      </div>

      {orgs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
          <p className="text-sm text-muted">
            {total === 0 && !filtrando
              ? "Todavía no hay organizaciones."
              : "Ninguna organización coincide con la búsqueda."}
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <p className="shrink-0 text-sm text-muted">
            {total} {total === 1 ? "organización" : "organizaciones"}
          </p>
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-white">
            <div
              ref={scrollRef}
              onScroll={chequearScroll}
              className="h-full overflow-x-auto overflow-y-auto"
            >
              <table className="w-full min-w-160 text-left text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                    <th className="px-8 py-5 font-medium">Organización</th>
                    <th className="px-8 py-5 font-medium">Tipo</th>
                    <th className="px-8 py-5 font-medium">Verificación</th>
                    <th className="px-8 py-5 font-medium">Creada</th>
                    <th className="px-8 py-5 font-medium">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {orgs.map((o) => (
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
            {hayMasAbajo && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-ink/10 to-transparent"
              />
            )}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            hrefForPage={hrefForPage}
            label="Paginación de organizaciones"
            className="shrink-0"
          />
        </div>
      )}
    </div>
  );
}
