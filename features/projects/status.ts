export const PROJECT_STATUS_LABELS: Record<string, string> = {
  borrador: "Borrador",
  en_revision: "En revisión",
  publicado: "Publicado",
  seleccion: "En selección",
  activo: "Activo",
  revision_final: "Revisión final",
  completado: "Completado",
  suspendido: "Suspendido",
  cancelado: "Cancelado",
};

export function projectStatusLabel(status: string | null) {
  return status ? PROJECT_STATUS_LABELS[status] ?? "Estado no disponible" : "Estado no disponible";
}
