/**
 * Catálogo de necesidades de ejemplo · /organizaciones
 * =====================================================
 *
 * Fuente única para:
 * - la rotación de la ficha del hero (`NECESIDADES_HERO`)
 * - el explorador de ejemplos más abajo (`EJEMPLOS_ORGANIZACION`)
 *
 * Criterio de producto: ejemplos básicos / intermedios, con alcance
 * razonable para estudiantes (no promesas avanzadas ni jerga de backoffice).
 *
 * ---------------------------------------------------------------------------
 * Cómo agregar un ejemplo nuevo
 * ---------------------------------------------------------------------------
 * 1. Copiá un objeto de `CATALOGO_NECESIDADES` y cambiale `id` (kebab-case único).
 * 2. Completá `ejemplo` (titulo / texto / entregable) — se muestra en DesafiosExplorer.
 * 3. Si también debe rotar en el hero:
 *    - poné `enHero: true`
 *    - completá `hero.titulo` (corto), `plazo`, `modalidad`
 *    - elegí un `grafico` de `GRAFICOS_HERO` (abajo)
 * 4. Si solo va al listado de ejemplos, dejá `enHero: false` y omití `hero`.
 * 5. No hace falta tocar el componente visual: autoplay, dots y fade leen el array.
 *
 * Cómo agregar un gráfico nuevo para el hero
 * ---------------------------------------------------------------------------
 * 1. Sumá el id a `GRAFICOS_HERO` en este archivo.
 * 2. Implementalo en `components/organizacion-hero-grafico.tsx` (mapa `GRAFICOS`).
 * 3. Referencialo desde `hero.grafico` en el ítem del catálogo.
 */

/** Identificadores de mini-gráficos abstractos del hero. */
export const GRAFICOS_HERO = [
  "barras",
  "nodos",
  "pantallas",
  "pasos",
  "bloques",
] as const;

export type GraficoHeroId = (typeof GRAFICOS_HERO)[number];

export type EjemploOrganizacion = {
  titulo: string;
  texto: string;
  entregable: string;
};

export type NecesidadHero = {
  id: string;
  titulo: string;
  plazo: string;
  modalidad: string;
  grafico: GraficoHeroId;
};

type EntradaCatalogo = {
  id: string;
  /** Si es true, rota en la ficha del hero. */
  enHero: boolean;
  /** Copy de la sección de ejemplos (DesafiosExplorer). */
  ejemplo: EjemploOrganizacion;
  /**
   * Datos de la ficha del hero. Obligatorio cuando `enHero` es true.
   * El título del hero puede ser más corto/directo que `ejemplo.titulo`.
   */
  hero?: Omit<NecesidadHero, "id">;
};

/**
 * Catálogo curado. Editar aquí; los exports derivados se recalculan solos.
 */
export const CATALOGO_NECESIDADES = [
  {
    id: "dashboard",
    enHero: true,
    ejemplo: {
      titulo: "Visualizar datos operativos",
      texto: "Crear un dashboard inicial para identificar oportunidades.",
      entregable:
        "Un tablero con los indicadores clave y una guía breve de lectura.",
    },
    hero: {
      titulo: "Dashboard con indicadores operativos",
      plazo: "5–6 semanas",
      modalidad: "Remoto / híbrido",
      grafico: "barras",
    },
  },
  {
    id: "fricciones",
    enHero: true,
    ejemplo: {
      titulo: "Entender la experiencia de clientes",
      texto: "Investigar puntos de fricción y proponer mejoras.",
      entregable:
        "Un mapa de fricciones priorizado con recomendaciones accionables.",
    },
    hero: {
      titulo: "Mapa de fricciones de clientes",
      plazo: "4–5 semanas",
      modalidad: "Remoto",
      grafico: "nodos",
    },
  },
  {
    id: "prototipo",
    enHero: true,
    ejemplo: {
      titulo: "Diseñar un prototipo digital",
      texto: "Convertir una idea en un flujo o interfaz inicial.",
      entregable: "Un flujo navegable o wireframes de las pantallas principales.",
    },
    hero: {
      titulo: "Prototipo de un flujo digital",
      plazo: "3–5 semanas",
      modalidad: "Remoto / híbrido",
      grafico: "pantallas",
    },
  },
  {
    id: "proceso",
    enHero: true,
    ejemplo: {
      titulo: "Ordenar un proceso",
      texto: "Mapear tareas, detectar problemas y proponer una mejora.",
      entregable:
        "Un diagrama del proceso actual y una propuesta de mejora concreta.",
    },
    hero: {
      titulo: "Ordenar un proceso interno",
      plazo: "4–5 semanas",
      modalidad: "Híbrido",
      grafico: "pasos",
    },
  },
  {
    id: "contenido",
    enHero: true,
    ejemplo: {
      titulo: "Crear una estrategia de contenido",
      texto: "Definir una base de comunicación para una iniciativa.",
      entregable: "Un plan base con temas, formatos y un calendario inicial.",
    },
    hero: {
      titulo: "Plan base de contenidos",
      plazo: "3–4 semanas",
      modalidad: "Remoto",
      grafico: "bloques",
    },
  },
  {
    id: "hallazgos",
    enHero: false,
    ejemplo: {
      titulo: "Transformar información en decisiones",
      texto: "Organizar datos y presentar hallazgos accionables.",
      entregable: "Un informe con hallazgos y próximos pasos sugeridos.",
    },
  },
] as const satisfies readonly EntradaCatalogo[];

/** Intervalo del autoplay de la ficha del hero (ms). */
export const HERO_NECESIDAD_INTERVALO_MS = 4200;

/**
 * Ítems que rotan en el hero. Solo entradas con `enHero: true` y `hero` definido.
 */
export const NECESIDADES_HERO: readonly NecesidadHero[] = CATALOGO_NECESIDADES.flatMap(
  (n) =>
    n.enHero && n.hero
      ? [
          {
            id: n.id,
            titulo: n.hero.titulo,
            plazo: n.hero.plazo,
            modalidad: n.hero.modalidad,
            grafico: n.hero.grafico,
          },
        ]
      : [],
);

/**
 * Ítems del explorador de ejemplos (mismo orden que el catálogo).
 */
export const EJEMPLOS_ORGANIZACION: readonly EjemploOrganizacion[] =
  CATALOGO_NECESIDADES.map((n) => n.ejemplo);
