import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Campo de texto de una línea, con el estilo base de los formularios. */
export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-ink",
        "placeholder:text-muted/70",
        "focus-visible:border-electric focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-electric/30",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
