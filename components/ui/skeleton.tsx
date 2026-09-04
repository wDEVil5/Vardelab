import { cn } from "@/lib/utils";

/**
 * Bloque de carga (skeleton): un placeholder con pulso suave que reserva la
 * forma del contenido mientras el Server Component resuelve sus datos. El pulso
 * se desactiva con `prefers-reduced-motion` (`motion-reduce:animate-none`).
 *
 * Presentacional y decorativo: va con `aria-hidden`. El anuncio de carga para
 * lectores de pantalla lo pone el contenedor del `loading.tsx` (role="status").
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-md bg-ink/5 motion-reduce:animate-none",
        className,
      )}
    />
  );
}
