// Estados de `projects` y su etiqueta en español — sin dependencias de
// servidor (a diferencia de `queries.ts`, que importa `next/headers` vía el
// cliente de Supabase), para poder usarse también desde componentes cliente
// como `ProjectsTable` sin arrastrar ese import al bundle del navegador.

export const ESTADOS_PROYECTO = [
  "borrador",
  "en_revision",
  "publicado",
  "seleccion",
  "activo",
  "revision_final",
  "completado",
  "suspendido",
  "cancelado",
] as const;

export const ETIQUETA_ESTADO: Record<(typeof ESTADOS_PROYECTO)[number], string> = {
  borrador: "Borrador",
  en_revision: "En revisión",
  publicado: "Publicado",
  seleccion: "Selección",
  activo: "Activo",
  revision_final: "Revisión final",
  completado: "Completado",
  suspendido: "Suspendido",
  cancelado: "Cancelado",
};

export const ADMIN_PROJECT_STATUS_OPTIONS = ESTADOS_PROYECTO.map((s) => ({
  value: s,
  label: ETIQUETA_ESTADO[s],
}));
