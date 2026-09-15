/**
 * Interruptor de "miembros de organización" (M37/M38). Server y cliente leen
 * esta misma bandera — server porque es la barrera real (un POST armado a
 * mano saltea cualquier botón deshabilitado en el cliente); cliente para que
 * el botón se vea y se comporte deshabilitado en vez de fallar en silencio.
 * Activada 2026-09-15, junto con el link real en /editar (antes "Próximamente").
 */
export const INVITACIONES_HABILITADAS = true;
