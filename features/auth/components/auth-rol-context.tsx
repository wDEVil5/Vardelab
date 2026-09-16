"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Rol } from "@/features/auth/components/signup-form";

type AuthRolContextValue = {
  rol: Rol;
  setRol: (rol: Rol) => void;
};

const AuthRolContext = createContext<AuthRolContextValue | null>(null);

/**
 * Rol del registro, compartido entre el formulario y el panel de marca del
 * shell de credenciales (para que el peek cambie sin remontar el layout).
 */
export function AuthRolProvider({
  initialRol = "estudiante",
  children,
}: {
  initialRol?: Rol;
  children: ReactNode;
}) {
  const [rol, setRolState] = useState<Rol>(initialRol);
  const setRol = useCallback((next: Rol) => {
    setRolState(next);
  }, []);

  const value = useMemo(() => ({ rol, setRol }), [rol, setRol]);

  return (
    <AuthRolContext.Provider value={value}>{children}</AuthRolContext.Provider>
  );
}

export function useAuthRol(): AuthRolContextValue {
  const ctx = useContext(AuthRolContext);
  if (!ctx) {
    throw new Error("useAuthRol debe usarse dentro de AuthRolProvider");
  }
  return ctx;
}
