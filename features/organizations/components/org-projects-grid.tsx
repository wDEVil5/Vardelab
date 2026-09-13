"use client";

import { useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProjectCard } from "@/features/projects/components/project-card";
import type { ProjectCard as ProjectCardData } from "@/features/projects/queries";

const PASO = 6;

/**
 * Grilla de proyectos publicados de una organización, con "Ver más" en vez de
 * mostrarlos todos de una: una organización con muchos proyectos volvería la
 * ficha pública interminable. Se revela de a `PASO`, sin recargar ni paginar
 * contra el servidor — la lista completa ya la trae la página (es pública y
 * liviana), esto solo controla cuánto se ve de una.
 */
export function OrgProjectsGrid({ proyectos }: { proyectos: ProjectCardData[] }) {
  const [visibles, setVisibles] = useState(PASO);
  const mostrados = proyectos.slice(0, visibles);
  const restantes = proyectos.length - mostrados.length;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {mostrados.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
      {restantes > 0 && (
        <button
          type="button"
          onClick={() => setVisibles((v) => v + PASO)}
          className={cn(buttonClasses({ variant: "outline", size: "sm" }), "self-center")}
        >
          Ver {Math.min(restantes, PASO)} más
        </button>
      )}
    </div>
  );
}
