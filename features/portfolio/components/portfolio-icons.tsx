// Íconos mínimos en línea (trazo), mismo criterio que
// `features/profile/components/profile-icons.tsx`: un ícono por campo para
// identificarlo de un vistazo, sin depender solo del placeholder.
export type PortafolioIcon = "titulo" | "descripcion" | "enlace" | "proyecto" | "ojo" | "ojo_tachado" | "papelera";

const PATHS: Record<PortafolioIcon, string> = {
  titulo: "M4 6h16M4 12h10M4 18h7",
  descripcion:
    "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z",
  enlace: "M9 17H7A5 5 0 017 7h2m6 10h2a5 5 0 000-10h-2M8 12h8",
  proyecto: "M4 7h16v11a2 2 0 01-2 2H6a2 2 0 01-2-2zM8 7V5a2 2 0 012-2h4a2 2 0 012 2v2",
  ojo: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 15a3 3 0 100-6 3 3 0 000 6z",
  ojo_tachado:
    "M3 3l18 18M10.6 10.6a3 3 0 004 4M9.4 5.5A9.6 9.6 0 0112 5c6.5 0 10 7 10 7a15.6 15.6 0 01-3.2 4.1M6.6 6.6C4 8.3 2 12 2 12s3.5 7 10 7c1.4 0 2.6-.3 3.7-.8",
  papelera: "M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0v12a1 1 0 001 1h6a1 1 0 001-1V7",
};

export function PortafolioIconSvg({
  name,
  className = "size-4",
}: {
  name: PortafolioIcon;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
