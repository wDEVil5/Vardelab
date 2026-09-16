import type { ReactNode } from "react";
import type { GraficoHeroId } from "@/features/organizations/necesidades-ejemplo";

/**
 * Mini-gráficos abstractos del hero de /organizaciones.
 *
 * Para agregar uno nuevo:
 * 1. Sumá el id en `GRAFICOS_HERO` (`features/organizations/necesidades-ejemplo.ts`).
 * 2. Agregá una entrada en el mapa `GRAFICOS` de abajo.
 * 3. Usalo en `hero.grafico` del catálogo.
 *
 * Son decorativos (aria-hidden desde el padre); no llevan texto de producto.
 */

function GraficoBarras() {
  return (
    <div className="absolute inset-x-5 bottom-4 flex items-end gap-2.5">
      <div className="h-11 w-3.5 rounded-t-md bg-white/25" />
      <div className="h-16 w-3.5 rounded-t-md bg-white/40" />
      <div className="h-14 w-3.5 rounded-t-md bg-sprout/85" />
      <div className="h-20 w-3.5 rounded-t-md bg-white/55" />
      <div className="h-9 w-3.5 rounded-t-md bg-white/30" />
      <div className="ml-auto flex w-22 flex-col gap-2 self-center rounded-xl bg-white/12 p-2.5 backdrop-blur-[2px]">
        <div className="h-2 w-full rounded-full bg-white/40" />
        <div className="h-2 w-[80%] rounded-full bg-white/28" />
        <div className="h-2 w-[60%] rounded-full bg-sprout/75" />
      </div>
    </div>
  );
}

function GraficoNodos() {
  return (
    <div className="absolute inset-x-6 bottom-5 flex items-center justify-between gap-2">
      {["A", "B", "C", "D"].map((label, i) => (
        <div key={label} className="flex flex-1 items-center gap-2">
          <div
            className={
              i === 2
                ? "flex size-9 items-center justify-center rounded-full bg-sprout text-[10px] font-bold text-ink"
                : "flex size-9 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold text-white"
            }
          >
            {label}
          </div>
          {i < 3 ? <div className="h-0.5 flex-1 rounded-full bg-white/30" /> : null}
        </div>
      ))}
    </div>
  );
}

function GraficoPantallas() {
  return (
    <div className="absolute inset-x-6 bottom-4 flex items-end gap-3">
      <div className="h-16 w-[30%] rounded-xl border border-white/25 bg-white/10 p-2">
        <div className="h-2 w-3/4 rounded-full bg-white/35" />
        <div className="mt-2 space-y-1.5">
          <div className="h-6 rounded-md bg-white/15" />
          <div className="h-6 rounded-md bg-white/10" />
        </div>
      </div>
      <div className="h-20 w-[38%] rounded-xl border border-white/30 bg-white/15 p-2 shadow-lg">
        <div className="h-2 w-2/3 rounded-full bg-sprout/80" />
        <div className="mt-2 h-10 rounded-md bg-white/20" />
      </div>
      <div className="h-14 w-[26%] rounded-xl border border-white/20 bg-white/10 p-2 opacity-80">
        <div className="h-2 w-1/2 rounded-full bg-white/30" />
        <div className="mt-2 h-5 rounded-md bg-white/15" />
      </div>
    </div>
  );
}

function GraficoPasos() {
  return (
    <div className="absolute inset-x-5 bottom-5 flex flex-col gap-2">
      {[
        { w: "w-full", active: false },
        { w: "w-[88%]", active: true },
        { w: "w-[72%]", active: false },
      ].map((row, i) => (
        <div
          key={i}
          className={`flex items-center gap-2 rounded-xl px-2.5 py-2 ${
            row.active ? "bg-sprout/85" : "bg-white/12"
          }`}
        >
          <span
            className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
              row.active ? "bg-ink/15 text-ink" : "bg-white/20 text-white"
            }`}
          >
            {i + 1}
          </span>
          <span
            className={`h-1.5 rounded-full ${row.active ? "bg-ink/25" : "bg-white/35"} ${row.w}`}
          />
        </div>
      ))}
    </div>
  );
}

function GraficoBloques() {
  return (
    <div className="absolute inset-x-5 bottom-4 grid grid-cols-3 gap-2">
      {["Tema", "Formato", "Fecha", "Canal", "Pieza", "Hito"].map((label, i) => (
        <div
          key={label}
          className={`rounded-xl px-2 py-2 ${
            i === 1 || i === 4 ? "bg-sprout/80" : "bg-white/12"
          }`}
        >
          <div
            className={`h-1.5 w-10 rounded-full ${
              i === 1 || i === 4 ? "bg-ink/25" : "bg-white/40"
            }`}
          />
          <div
            className={`mt-2 h-1.5 w-7 rounded-full ${
              i === 1 || i === 4 ? "bg-ink/15" : "bg-white/25"
            }`}
          />
        </div>
      ))}
    </div>
  );
}

const GRAFICOS: Record<GraficoHeroId, () => ReactNode> = {
  barras: GraficoBarras,
  nodos: GraficoNodos,
  pantallas: GraficoPantallas,
  pasos: GraficoPasos,
  bloques: GraficoBloques,
};

export function OrganizacionHeroGrafico({ tipo }: { tipo: GraficoHeroId }) {
  const Render = GRAFICOS[tipo];
  return <Render />;
}
