import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CampusLab",
  description:
    "Plataforma de microproyectos reales que conecta estudiantes con necesidades de organizaciones.",
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
