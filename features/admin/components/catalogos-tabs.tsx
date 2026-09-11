"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import type { SkillCatalogRow, ModalidadUsage } from "@/features/admin/queries";
import { SkillFormDialog } from "@/features/admin/components/skill-form-dialog";
import { ToggleSkillButton } from "@/features/admin/components/toggle-skill-button";
import { RenameCategoryButton } from "@/features/admin/components/rename-category-button";

type Pestana = "habilidades" | "categorias" | "modalidades";

/**
 * Paginación por páginas (no scroll infinito): en una tabla de administración
 * lo que importa es poder ubicar un ítem puntual, no desplazarse sin fin como
 * en un feed. Todo en memoria — el catálogo es curado a mano (hoy 16
 * habilidades); si algún día llega a un volumen real distinto, ahí sí
 * convendría paginar del lado del servidor.
 */
const FILAS_POR_PAGINA = 10;

function Paginacion({
  pagina,
  totalPaginas,
  onCambiar,
}: {
  pagina: number;
  totalPaginas: number;
  onCambiar: (pagina: number) => void;
}) {
  if (totalPaginas <= 1) return null;
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted">
        Página {pagina} de {totalPaginas}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pagina <= 1}
          onClick={() => onCambiar(pagina - 1)}
          className={buttonClasses({ variant: "outline", size: "sm" })}
        >
          Anterior
        </button>
        <button
          type="button"
          disabled={pagina >= totalPaginas}
          onClick={() => onCambiar(pagina + 1)}
          className={buttonClasses({ variant: "outline", size: "sm" })}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

const PESTANAS: { id: Pestana; label: string }[] = [
  { id: "habilidades", label: "Habilidades" },
  { id: "categorias", label: "Categorías" },
  { id: "modalidades", label: "Modalidades" },
];

/**
 * Tabs del catálogo (D-02). "Categorías" y "Modalidades" no son entidades
 * propias del modelo (la primera es una columna de texto en `skills`, la
 * segunda un `enum` fijo de Postgres) — se derivan de `skills`/`modalidades`
 * en vez de tener su propia tabla, y sus acciones disponibles reflejan esa
 * diferencia real (Modalidades no tiene "Agregar" ni "Editar": son valores de
 * esquema, no filas).
 */
export function CatalogosTabs({
  skills,
  modalidades,
}: {
  skills: SkillCatalogRow[];
  modalidades: ModalidadUsage[];
}) {
  const [pestana, setPestana] = useState<Pestana>("habilidades");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Tipo de catálogo" className="inline-flex gap-1 self-start rounded-full bg-surface p-1">
          {PESTANAS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={pestana === p.id}
              onClick={() => setPestana(p.id)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                pestana === p.id ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        {pestana === "habilidades" && (
          <SkillFormDialog trigger="Agregar habilidad" triggerClassName={buttonClasses({ variant: "primary", size: "md" })} />
        )}
      </div>

      {pestana === "habilidades" && <HabilidadesTable skills={skills} />}
      {pestana === "categorias" && <CategoriasTable skills={skills} />}
      {pestana === "modalidades" && <ModalidadesTable modalidades={modalidades} />}
    </div>
  );
}

function HabilidadesTable({ skills }: { skills: SkillCatalogRow[] }) {
  const [query, setQuery] = useState("");
  const [pagina, setPagina] = useState(1);

  const filtradas = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return skills;
    return skills.filter(
      (s) => s.nombre.toLowerCase().includes(q) || s.categoria.toLowerCase().includes(q),
    );
  }, [skills, query]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / FILAS_POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const visibles = filtradas.slice(
    (paginaSegura - 1) * FILAS_POR_PAGINA,
    paginaSegura * FILAS_POR_PAGINA,
  );

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[3fr_1fr] lg:gap-12">
      <div className="flex min-w-0 flex-col gap-5">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPagina(1);
          }}
          placeholder="Buscar por nombre o categoría"
          aria-label="Buscar por nombre o categoría"
          className="h-11 rounded-lg border border-border bg-white px-4 text-sm text-ink placeholder:text-muted focus:border-electric focus:outline-none sm:w-80"
        />

        {visibles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
            <p className="text-sm text-muted">
              {skills.length === 0 ? "Todavía no hay habilidades." : "Ninguna habilidad coincide con la búsqueda."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-white">
            <table className="w-full min-w-180 text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <th className="px-8 py-5 font-medium">Nombre</th>
                  <th className="px-8 py-5 font-medium">Categoría</th>
                  <th className="px-8 py-5 font-medium">Uso</th>
                  <th className="px-8 py-5 font-medium">Estado</th>
                  <th className="px-8 py-5 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((s) => (
                  <tr key={s.id} className="border-b border-border/60 last:border-0">
                    <td className="px-8 py-6 font-medium text-ink">{s.nombre}</td>
                    <td className="px-8 py-6 text-muted">{s.categoria}</td>
                    <td className="px-8 py-6 text-muted">
                      {s.perfiles} {s.perfiles === 1 ? "perfil" : "perfiles"}
                    </td>
                    <td className="px-8 py-6">
                      <Badge tone={s.activo ? "success" : "neutral"}>
                        {s.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end gap-3">
                        <SkillFormDialog
                          trigger="Editar"
                          triggerClassName="text-sm font-medium text-electric hover:underline"
                          skill={s}
                        />
                        <ToggleSkillButton skillId={s.id} nombre={s.nombre} activo={s.activo} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Paginacion pagina={paginaSegura} totalPaginas={totalPaginas} onCambiar={setPagina} />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="text-sm font-medium text-ink">Al desactivar una habilidad</p>
        <p className="mt-2 text-sm text-muted">
          Deja de ofrecerse en formularios nuevos, pero nada se borra: los perfiles y
          proyectos que ya la tienen cargada la conservan.
        </p>
        <p className="mt-3 border-t border-border pt-3 text-sm text-muted">
          <span className="font-medium text-ink">Excepción conocida: </span>
          si quien la tiene cargada no es admin, puede dejar de ver el nombre en su propio
          perfil. Es una limitación pendiente de resolver, no el comportamiento esperado.
        </p>
      </div>
    </div>
  );
}

type GrupoCategoria = { categoria: string; habilidades: number; perfiles: number };

function CategoriasTable({ skills }: { skills: SkillCatalogRow[] }) {
  const [pagina, setPagina] = useState(1);

  const grupos = useMemo(() => {
    const mapa = new Map<string, GrupoCategoria>();
    for (const s of skills) {
      const actual = mapa.get(s.categoria) ?? { categoria: s.categoria, habilidades: 0, perfiles: 0 };
      actual.habilidades += 1;
      actual.perfiles += s.perfiles;
      mapa.set(s.categoria, actual);
    }
    return [...mapa.values()].sort((a, b) => a.categoria.localeCompare(b.categoria));
  }, [skills]);

  const totalPaginas = Math.max(1, Math.ceil(grupos.length / FILAS_POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const visibles = grupos.slice(
    (paginaSegura - 1) * FILAS_POR_PAGINA,
    paginaSegura * FILAS_POR_PAGINA,
  );

  if (grupos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
        <p className="text-sm text-muted">Todavía no hay categorías (dependen de que existan habilidades).</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full min-w-140 text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="px-8 py-5 font-medium">Nombre</th>
              <th className="px-8 py-5 font-medium">Habilidades</th>
              <th className="px-8 py-5 font-medium">Uso</th>
              <th className="px-8 py-5 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((g) => (
              <tr key={g.categoria} className="border-b border-border/60 last:border-0">
                <td className="px-8 py-6 font-medium text-ink">{g.categoria}</td>
                <td className="px-8 py-6 text-muted">{g.habilidades}</td>
                <td className="px-8 py-6 text-muted">
                  {g.perfiles} {g.perfiles === 1 ? "perfil" : "perfiles"}
                </td>
                <td className="px-8 py-6">
                  <div className="flex justify-end">
                    <RenameCategoryButton categoria={g.categoria} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Paginacion pagina={paginaSegura} totalPaginas={totalPaginas} onCambiar={setPagina} />
    </div>
  );
}

function ModalidadesTable({ modalidades }: { modalidades: ModalidadUsage[] }) {
  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[3fr_1fr] lg:gap-12">
      <div className="min-w-0 overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full min-w-100 text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="px-8 py-5 font-medium">Modalidad</th>
              <th className="px-8 py-5 font-medium">Proyectos</th>
            </tr>
          </thead>
          <tbody>
            {modalidades.map((m) => (
              <tr key={m.valor} className="border-b border-border/60 last:border-0">
                <td className="px-8 py-6 font-medium text-ink">{m.etiqueta}</td>
                <td className="px-8 py-6 text-muted">{m.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="text-sm font-medium text-ink">Por qué esta lista no se edita</p>
        <p className="mt-2 text-sm text-muted">
          Las modalidades son parte fija del sistema, no una tabla de la base de datos:
          agregar o quitar una requiere un cambio de código, no un botón.
        </p>
      </div>
    </div>
  );
}
