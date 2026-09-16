"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type AuthUserContextValue = {
  user: User | null;
  loading: boolean;
};

const AuthUserContext = createContext<AuthUserContextValue | null>(null);

/**
 * Sesión resuelta una sola vez por página y compartida entre header y footer
 * (antes cada uno hacía su propio `auth.getUser()` + `onAuthStateChange`: dos
 * round-trips a Supabase y dos suscripciones por página con ambos montados).
 */
export function AuthUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let vigente = true;
    const supabase = createClient();

    async function cargar() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (vigente) {
        setUser(authUser);
        setLoading(false);
      }
    }

    cargar();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => cargar());

    return () => {
      vigente = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthUserContext.Provider value={{ user, loading }}>
      {children}
    </AuthUserContext.Provider>
  );
}

/** Fuera de `AuthUserProvider` (p. ej. en `(auth)`): siempre "sin sesión". */
export function useAuthUser(): AuthUserContextValue {
  const ctx = useContext(AuthUserContext);
  return ctx ?? { user: null, loading: false };
}
