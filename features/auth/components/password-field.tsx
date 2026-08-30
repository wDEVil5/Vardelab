"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PASSWORD_RULES } from "@/features/auth/password";

/**
 * Campo de contraseña con mostrar/ocultar y una lista de requisitos que se marca
 * en vivo. Guía al usuario a crear una contraseña segura; la validación real la
 * hace la Server Action con la misma política (`isPasswordValid`).
 */
export function PasswordField() {
  const [value, setValue] = useState("");
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">Contraseña</span>

      <div className="relative">
        <Input
          type={visible ? "text" : "password"}
          name="password"
          autoComplete="new-password"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Crea una contraseña segura"
          className="pr-16"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted hover:text-electric"
        >
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </div>

      {/* Requisitos: se marcan a medida que se cumplen. */}
      <ul className="mt-1 grid grid-cols-2 gap-1">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(value);
          return (
            <li
              key={rule.id}
              className={cn(
                "flex items-center gap-1.5 text-xs",
                ok ? "text-sprout" : "text-muted",
              )}
            >
              <span aria-hidden>{ok ? "✓" : "○"}</span>
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
