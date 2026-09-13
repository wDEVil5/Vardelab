/**
 * Interruptor de "miembros de organización" (M37/M38): la feature ya funciona
 * de punta a punta pero no está anunciada ni enlazada desde ningún lado
 * ("Próximamente" en /editar). Server y cliente leen esta misma bandera —
 * server porque es la barrera real (un POST armado a mano saltea cualquier
 * botón deshabilitado en el cliente); cliente para que el botón se vea y se
 * comporte deshabilitado en vez de fallar en silencio. Cambiar a `true` acá
 * para lanzarla.
 */
export const INVITACIONES_HABILITADAS = false;
