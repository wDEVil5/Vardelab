import type { ProjectCard } from "@/features/projects/queries";

/**
 * Filtrado del catálogo (P-02). Se resuelve en memoria sobre el conjunto ya
 * consultado: el catálogo del piloto es chico, y así se derivan los chips de las
 * habilidades presentes sin una consulta extra. A escala real esto se movería a
 * la base (índices / full-text search sobre título y resumen).
 */

export type ProjectFilters = {
  q?: string;
  skill?: string;
  modalidad?: string;
};

/**
 * Normaliza texto para buscar sin distinguir mayúsculas ni acentos: pasa a
 * minúsculas y descompone los diacríticos (NFD) para eliminar el rango de marcas
 * combinantes (U+0300–U+036F). Así "Automatización", "automatizacion" y
 * "AUTOMATIZACIÓN" comparan igual.
 */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Habilidades distintas presentes en los proyectos, ordenadas, para los chips. */
export function projectSkillFacets(projects: ProjectCard[]): string[] {
  const set = new Set<string>();
  for (const p of projects) {
    for (const rol of p.roles ?? []) {
      for (const s of rol.skills ?? []) {
        if (s.skill?.nombre) set.add(s.skill.nombre);
      }
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/** Aplica búsqueda por texto + filtros de habilidad y modalidad. */
export function filterProjects(
  projects: ProjectCard[],
  { q, skill, modalidad }: ProjectFilters,
): ProjectCard[] {
  const needle = q ? normalizar(q.trim()) : "";

  return projects.filter((p) => {
    // Búsqueda por texto (sin acentos): título o resumen.
    if (needle) {
      const heno = normalizar(`${p.titulo} ${p.resumen ?? ""}`);
      if (!heno.includes(needle)) return false;
    }

    // Modalidad: coincidencia exacta con el enum.
    if (modalidad && p.modalidad !== modalidad) return false;

    // Habilidad: el proyecto pasa si algún rol la exige.
    if (skill) {
      const laTiene = (p.roles ?? []).some((rol) =>
        (rol.skills ?? []).some((s) => s.skill?.nombre === skill),
      );
      if (!laTiene) return false;
    }

    return true;
  });
}
