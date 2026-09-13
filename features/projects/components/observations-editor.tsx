"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Fila = { id: string; categoria: string; texto: string };

/**
 * Lista editable de observaciones puntuales (S-07/M36) dentro del formulario
 * de rechazo del moderador: categoría corta ("Alcance", "Datos"…) + qué debe
 * cambiar. Se manda como JSON en un campo oculto porque la cantidad de filas
 * es variable — más simple que nombrar inputs indexados a mano.
 */
export function ObservationsEditor() {
  const [filas, setFilas] = useState<Fila[]>([]);
  const uid = useId();

  const agregar = () =>
    setFilas((f) => [...f, { id: `${uid}-${f.length}-${Date.now()}`, categoria: "", texto: "" }]);

  const quitar = (id: string) => setFilas((f) => f.filter((fila) => fila.id !== id));

  const editar = (id: string, campo: "categoria" | "texto", valor: string) =>
    setFilas((f) => f.map((fila) => (fila.id === id ? { ...fila, [campo]: valor } : fila)));

  return (
    <div className="flex flex-col gap-2.5">
      <input
        type="hidden"
        name="observaciones"
        value={JSON.stringify(filas.map(({ categoria, texto }) => ({ categoria, texto })))}
      />

      {filas.map((fila) => (
        <div key={fila.id} className="flex items-start gap-2">
          <Input
            value={fila.categoria}
            onChange={(e) => editar(fila.id, "categoria", e.target.value)}
            placeholder="Categoría"
            className="w-28 shrink-0"
          />
          <Input
            value={fila.texto}
            onChange={(e) => editar(fila.id, "texto", e.target.value)}
            placeholder="Qué debe cambiar…"
          />
          <button
            type="button"
            onClick={() => quitar(fila.id)}
            aria-label="Quitar observación"
            className="mt-2 shrink-0 text-muted hover:text-coral"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      ))}

      <Button type="button" variant="ghost" size="sm" onClick={agregar} className="self-start">
        + Agregar observación
      </Button>
    </div>
  );
}
