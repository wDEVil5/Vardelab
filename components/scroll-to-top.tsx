"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Al cambiar de ruta, sube al tope al instante. Sin esto, si venías scrolleado
 * (p. ej. el CTA "Hablar con CampusLab" al final de /organizaciones) la página
 * nueva más corta puede abrir ya mirando el footer cortina.
 * `behavior: "instant"` evita pelearse con `scroll-behavior: smooth` del html.
 */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--footer-rev", "0");
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
