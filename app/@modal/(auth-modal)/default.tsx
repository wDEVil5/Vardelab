// Fallback del grupo (auth-modal): al navegar a una ruta que no es
// (.)ingresar ni (.)registro (p. ej. /recuperar, que no está interceptada),
// Next necesita este default acá — no le alcanza con el de app/@modal/ — o
// el modal se queda montado y vacío en vez de cerrarse.
export default function Default() {
  return null;
}
