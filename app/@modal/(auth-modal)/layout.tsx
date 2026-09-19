import type { ReactNode } from "react";
import { AuthModal } from "@/features/auth/components/auth-modal";

/**
 * Layout compartido de (.)ingresar y (.)registro dentro del slot @modal: el
 * marco del modal (fondo, tarjeta, botón de cerrar) NO se desmonta al pasar
 * de uno a otro — solo cambia `children` (el formulario). Sin esto, cada
 * navegación remonta todo el modal: se repite la animación de entrada y el
 * cambio de alto/ancho de la tarjeta se ve como un salto brusco en vez de
 * una transición.
 */
export default function AuthModalLayout({ children }: { children: ReactNode }) {
  return <AuthModal>{children}</AuthModal>;
}
