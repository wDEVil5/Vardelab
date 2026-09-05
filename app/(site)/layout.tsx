import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SkipLink } from "@/components/skip-link";

/**
 * Layout de la app con header global (catálogo, paneles, perfil, etc.). Las
 * rutas de este grupo se sirven en la misma URL: los paréntesis no aparecen en
 * la ruta.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SkipLink />
      <SiteHeader />
      {/* Landmark de destino del skip-link. `contents`-like: mantiene el flex
          del cuerpo (footer cortina) al ser flex-col flex-1 igual que el main. */}
      <div id="contenido-principal" tabIndex={-1} className="flex flex-1 flex-col">
        {children}
      </div>
    </>
  );
}
