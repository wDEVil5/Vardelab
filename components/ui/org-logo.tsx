import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "size-6 text-[10px]",
  md: "size-9 text-xs",
  lg: "size-16 text-lg",
} as const;

export type OrgLogoSize = keyof typeof sizeClasses;

// Conectores cortos a ignorar al armar las iniciales — sin filtrarlos, un
// nombre como "Unidad de Investigación · UNAB" daría "Ud" en vez de "UI".
const CONECTORES = new Set(["de", "del", "la", "el", "los", "las", "y", "en"]);

// Iniciales del nombre de la organización: "Fundación Semilla" → "FS",
// "Unidad de Investigación · UNAB" → "UI".
function iniciales(nombre: string): string {
  const palabras = nombre
    .trim()
    .split(/[\s·]+/)
    .filter((p) => p.length > 0 && !CONECTORES.has(p.toLowerCase()));

  if (palabras.length === 0) return "?";
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return palabras
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Logo de una organización, o sus iniciales si todavía no subió uno (S-01).
 * Presentacional y de solo lectura: para el selector con subida de archivo, ver
 * `OrgLogoPicker` (`features/organizations`).
 */
export function OrgLogo({
  logoUrl,
  nombre,
  size = "md",
  className,
}: {
  logoUrl: string | null | undefined;
  nombre: string;
  size?: OrgLogoSize;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-electric/10 font-semibold text-electric",
        sizeClasses[size],
        className,
      )}
    >
      {logoUrl ? (
        // Logo propio de la organización, no una URL externa arbitraria.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      ) : (
        iniciales(nombre)
      )}
    </span>
  );
}
