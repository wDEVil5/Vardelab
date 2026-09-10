import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Título y descripción por defecto: cada página puede pisarlos, pero el resto
// de los campos sociales (Open Graph, Twitter Card) los hereda de aquí salvo
// que la página los redefina. `metadataBase` resuelve `sitemap.ts`/`robots.ts`
// y las imágenes sociales a URLs absolutas usando la misma `SITE_URL`.
const TITULO = "CampusLab";
const DESCRIPCION =
  "Microproyectos reales que conectan a estudiantes con necesidades concretas de organizaciones.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITULO,
  description: DESCRIPCION,
  openGraph: {
    title: TITULO,
    description: DESCRIPCION,
    siteName: TITULO,
    url: "/",
    locale: "es_CL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: DESCRIPCION,
  },
};

/**
 * Layout raíz: solo el documento y la tipografía. El header NO vive aquí para
 * que los grupos de ruta decidan si lo muestran: `(site)` lo incluye, `(auth)`
 * (login/registro, pantalla completa) no.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
