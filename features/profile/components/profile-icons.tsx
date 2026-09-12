// Íconos mínimos en línea (trazo), para no cargar una librería — mismo
// lenguaje de ícono-en-círculo que ya usan las tarjetas KPI de /inicio.
// Compartidos entre la vista de solo lectura (/perfil) y el formulario de
// edición (ProfileForm), para que un campo se identifique igual en los dos.
export type PerfilIcon =
  | "bio"
  | "intereses"
  | "disponibilidad"
  | "enlaces"
  | "habilidades"
  | "portafolio"
  | "github"
  | "linkedin"
  | "sitio";

const PATHS: Partial<Record<PerfilIcon, string>> = {
  bio: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z",
  intereses: "M12 2l2.9 6.3L22 9l-5 5 1.3 7.1L12 17.8 5.7 21.1 7 14 2 9l7.1-.7z",
  disponibilidad: "M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z",
  enlaces: "M9 17H7A5 5 0 017 7h2m6 10h2a5 5 0 000-10h-2M8 12h8",
  habilidades: "M4 20V10m8 10V4m8 16v-7",
  portafolio: "M4 7h6l2 2h8v9a2 2 0 01-2 2H4z",
  // Mismo trazo circle+meridianos que ya usa la franja de visibilidad, para un
  // enlace "genérico" (sitio web) — no es un logo de marca, como sí lo son
  // github/linkedin.
  sitio: "M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18",
};

// github/linkedin sí son logos de marca (fill, no trazo) — mismo path que ya
// usa site-footer.tsx, para que el ícono se vea igual en todo el sitio.
const BRAND_PATHS: Partial<Record<PerfilIcon, string>> = {
  github:
    "M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z",
  linkedin:
    "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z",
};

export function PerfilIconSvg({
  name,
  className = "size-4",
}: {
  name: PerfilIcon;
  className?: string;
}) {
  const brandPath = BRAND_PATHS[name];
  if (brandPath) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
        <path d={brandPath} />
      </svg>
    );
  }
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
      <path d={PATHS[name] ?? ""} />
    </svg>
  );
}
