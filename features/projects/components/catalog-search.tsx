"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Buscador del catálogo en vivo. Actualiza `?q=` en la URL a medida que se
 * escribe o borra (con debounce), conservando los demás filtros. El filtrado lo
 * sigue haciendo el Server Component al re-renderizar con los nuevos params.
 */
export function CatalogSearch({ placeholder }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const qActual = params.get("q") ?? "";

  const [value, setValue] = useState(qActual);

  // Si la URL cambia por fuera (chips, "Limpiar filtros"), sincroniza el input.
  // Patrón de React: ajustar estado durante el render comparando con el valor
  // previo, en vez de un effect con setState (evita renders en cascada).
  const [qPrevio, setQPrevio] = useState(qActual);
  if (qActual !== qPrevio) {
    setQPrevio(qActual);
    setValue(qActual);
  }

  // Debounce: refleja el texto en la URL sin recargar en cada tecla.
  useEffect(() => {
    if (value === qActual) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(Array.from(params.entries()));
      if (value.trim()) next.set("q", value);
      else next.delete("q");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 250);
    return () => clearTimeout(t);
  }, [value, qActual, params, pathname, router]);

  return (
    <div className="relative">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-white px-4 py-3 pr-10 text-sm text-ink placeholder:text-muted focus:border-electric focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Limpiar búsqueda"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
        >
          ✕
        </button>
      )}
    </div>
  );
}
