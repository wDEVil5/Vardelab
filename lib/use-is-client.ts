import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * true solo tras la hidratación en el cliente. Reemplaza el patrón
 * useState(false) + useEffect(() => setMounted(true), []): ese setState
 * síncrono en un effect dispara un render en cascada que el linter marca
 * (react-hooks/set-state-in-effect); useSyncExternalStore evita el problema
 * porque React ya sabe re-renderizar tras la hidratación sin ese setState.
 */
export function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
