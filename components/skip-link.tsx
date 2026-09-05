/**
 * Enlace para saltar la navegación e ir directo al contenido principal. Está
 * oculto (`sr-only`) hasta recibir foco por teclado, cuando se revela como un
 * botón en la esquina superior. Debe ser el primer elemento enfocable de la
 * página; su destino es el landmark con `id="contenido-principal"`.
 */
export function SkipLink() {
  return (
    <a
      href="#contenido-principal"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:outline-2 focus:outline-offset-2 focus:outline-electric"
    >
      Saltar al contenido
    </a>
  );
}
