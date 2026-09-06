import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getPublishedProjects } from "@/features/projects/queries";

/**
 * `sitemap.xml` generado por Next. Reúne las rutas públicas estáticas y una
 * entrada por cada proyecto publicado (la RLS ya limita a `publicado`). Si la
 * consulta falla, se devuelve solo lo estático: el sitemap nunca debe romper.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const estaticas: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/proyectos`, changeFrequency: "daily", priority: 0.9 },
    {
      url: `${SITE_URL}/organizaciones`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    { url: `${SITE_URL}/contacto`, changeFrequency: "yearly", priority: 0.3 },
  ];

  let proyectos: MetadataRoute.Sitemap = [];
  try {
    const publicados = await getPublishedProjects();
    proyectos = (publicados ?? []).map((p) => ({
      url: `${SITE_URL}/proyectos/${p.id}`,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {
    proyectos = [];
  }

  return [...estaticas, ...proyectos];
}
