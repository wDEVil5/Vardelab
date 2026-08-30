/**
 * Política de contraseña, compartida por el formulario (cliente) y la Server
 * Action (servidor). El servidor es la barrera real; el cliente solo guía.
 */

export type PasswordRule = {
  id: string;
  label: string;
  test: (pw: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
  { id: "len", label: "Al menos 8 caracteres", test: (pw) => pw.length >= 8 },
  { id: "upper", label: "Una letra mayúscula", test: (pw) => /[A-Z]/.test(pw) },
  { id: "lower", label: "Una letra minúscula", test: (pw) => /[a-z]/.test(pw) },
  { id: "num", label: "Un número", test: (pw) => /\d/.test(pw) },
];

/** ¿La contraseña cumple todas las reglas de la política? */
export function isPasswordValid(pw: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(pw));
}
