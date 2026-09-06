import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * `robots.txt` generado por Next. Permite indexar el sitio público y bloquea
 * las áreas privadas o autenticadas (paneles, edición, formularios de sesión),
 * que no aportan a la búsqueda y además quedan tras la guarda de sesión.
 * Declara la ubicación del sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/inicio",
        "/perfil",
        "/mis-postulaciones",
        "/mis-proyectos",
        "/mis-organizaciones",
        "/moderacion",
        "/proponer",
        "/ingresar",
        "/registro",
        "/proyectos/*/postular",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
