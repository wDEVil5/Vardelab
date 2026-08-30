import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";

/**
 * Layout de la app con header global (catálogo, paneles, perfil, etc.). Las
 * rutas de este grupo se sirven en la misma URL: los paréntesis no aparecen en
 * la ruta.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
