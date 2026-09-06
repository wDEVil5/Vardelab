/**
 * URL base pública del sitio, para construir URLs absolutas (sitemap, robots y
 * metadata social). Se toma de `NEXT_PUBLIC_SITE_URL`; en local cae a
 * `http://localhost:3000`. Se normaliza sin barra final para concatenar rutas
 * de forma predecible (`${SITE_URL}/proyectos`).
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");
