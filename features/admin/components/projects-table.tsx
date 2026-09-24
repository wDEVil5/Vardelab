"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/pagination";
import type { AdminProjectRow } from "@/features/admin/queries";
import { ADMIN_PROJECT_STATUS_OPTIONS } from "@/features/admin/project-status";

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
 * Tabla de proyectos del piloto (D-01). Búsqueda y filtro de estado resueltos
 * en el servidor vía `?q=`/`?status=`/`?page=` (M79) — ya no trae todos los
 * proyectos para filtrarlos en memoria, así que escala con el volumen real
 * en vez de volverse una lista interminable. El input de búsqueda actualiza
 * la URL con debounce, mismo patrón que `CatalogSearch` del catálogo público.
 */
export function ProjectsTable({
  proyectos,
  total,
  page,
  totalPages,
  filters,
}: {
  proyectos: AdminProjectRow[];
  total: number;
  page: number;
  totalPages: number;
  filters: { q?: string; status?: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // El scroll de la lista vive en esta caja (no en la página, ver
  // admin/proyectos/page.tsx), así que Next.js no la resetea solo al navegar
  // entre páginas — sin esto, tras scrollear la lista y tocar "Siguiente", la
  // página nueva aparecía ya scrolleada en vez de arrancar arriba.
  const scrollRef = useRef<HTMLDivElement>(null);
  // Desvanecido abajo de la caja, para avisar que hay más filas que entran
  // por scroll — se oculta solo cuando ya se llegó al final (o cuando la
  // página completa entra sin necesitar scroll).
  const [hayMasAbajo, setHayMasAbajo] = useState(false);
  // Fade a la derecha: la tabla (`min-w-180`) puede desbordar su caja en
  // mobile — mismo motivo que `hayMasAbajo`, para el eje horizontal.
  const [hayMasDerecha, setHayMasDerecha] = useState(false);

  const chequearScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setHayMasAbajo(el.scrollHeight - el.scrollTop - el.clientHeight > 1);
    setHayMasDerecha(el.scrollWidth - el.scrollLeft - el.clientWidth > 1);
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    // El alto de la caja puede cambiar (ventana redimensionada, filas nuevas
    // más cortas/largas), así que se recalcula en el próximo frame en vez de
    // solo al montar.
    requestAnimationFrame(chequearScroll);
  }, [page, filters.q, filters.status]);

  useEffect(() => {
    window.addEventListener("resize", chequearScroll);
    return () => window.removeEventListener("resize", chequearScroll);
  }, []);

  const qActual = filters.q ?? "";
  const [query, setQuery] = useState(qActual);

  // Si la URL cambia por fuera (navegación con el botón atrás, etc.),
  // sincroniza el input.
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

  const onStatusChange = (value: string) => {
    const next = new URLSearchParams(Array.from(params.entries()));
    if (value !== "todos") next.set("status", value);
    else next.delete("status");
    next.delete("page");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const hrefForPage = (n: number) => {
    const sp = new URLSearchParams();
    if (filters.q) sp.set("q", filters.q);
    if (filters.status) sp.set("status", filters.status);
    if (n > 1) sp.set("page", String(n));
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const filtrando = Boolean(filters.q || filters.status);

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="shrink-0 flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por título o organización"
          aria-label="Buscar por título o organización"
          // `sm:flex-1` (no `flex-1` a secas): en mobile el wrapper es
          // `flex-col`, así que `flex-1` fija flex-basis 0% en el eje
          // principal — que ahí es el ALTO, no el ancho — y eso le gana a
          // `h-11`, dejando el input en ~19px. Recién desde `sm:flex-row`
          // el eje principal pasa a ser el ancho, donde `flex-1` sí es lo
          // que se busca (compartir la fila con el Select).
          className="h-11 rounded-lg border border-border bg-white px-4 text-sm text-ink placeholder:text-muted focus:border-electric focus:outline-none sm:flex-1"
        />
        <Select
          value={filters.status ?? "todos"}
          onChange={(e) => onStatusChange(e.target.value)}
          aria-label="Filtrar por estado"
          className="sm:w-48"
        >
          <option value="todos">Todos los estados</option>
          {ADMIN_PROJECT_STATUS_OPTIONS.map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
        </Select>
      </div>

      {proyectos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
          <p className="text-sm text-muted">
            {total === 0 && !filtrando
              ? "Todavía no hay proyectos."
              : "Ningún proyecto coincide con la búsqueda."}
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <p className="shrink-0 text-sm text-muted">
            {total} {total === 1 ? "proyecto" : "proyectos"}
          </p>
          {/* Solo esta caja scrollea (lg:overflow-y-auto): la lista llena el
              alto disponible con la mayor cantidad de filas que entren, y la
              paginación de abajo queda fija en su lugar en vez de irse al
              fondo de una página larga. */}
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-white">
            <div
              ref={scrollRef}
              onScroll={chequearScroll}
              className="h-full overflow-x-auto overflow-y-auto"
            >
              <table className="w-full min-w-160 text-left text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                    <th className="px-8 py-5 font-medium">Proyecto</th>
                    <th className="px-8 py-5 font-medium">Organización</th>
                    <th className="px-8 py-5 font-medium">Estado</th>
                    <th className="px-8 py-5 font-medium">Creado</th>
                    <th className="px-8 py-5 font-medium">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {proyectos.map((p) => (
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
            {hayMasAbajo && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-ink/10 to-transparent"
              />
            )}
            {hayMasDerecha && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-ink/10 to-transparent"
              />
            )}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            hrefForPage={hrefForPage}
            label="Paginación de proyectos"
            className="shrink-0"
          />
        </div>
      )}
    </div>
  );
}
