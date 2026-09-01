/**
 * Deriva el nivel de entrada de un rol para presentarlo al estudiante. Se
 * considera "apto sin experiencia" salvo que alguna habilidad exija nivel
 * 'avanzado': lo básico e intermedio se aprende en el camino, y un rol sin
 * habilidades queda abierto a cualquiera. El criterio es deliberadamente amplio
 * para bajar la barrera de postulación; solo se excluye lo que pide expertise
 * avanzada real. Se deriva del `nivel_minimo` que ya define el patrocinador, sin
 * un campo dedicado.
 */
export function esAptoSinExperiencia(
  skills: { nivel_minimo: string | null }[],
): boolean {
  return skills.every((s) => s.nivel_minimo !== "avanzado");
}
