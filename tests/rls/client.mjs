import { execFileSync } from 'node:child_process';

const DB_URL = process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

/**
 * Ejecuta SQL contra el Postgres local de Supabase simulando un rol/usuario
 * real — mismo mecanismo que ya se usó a mano varias veces en este proyecto
 * (ver BACKEND.md, M84 y otras): `set role` + `set request.jwt.claim.sub`,
 * que es lo que lee `auth.uid()` (ver `auth.uid()` en el esquema `auth`).
 *
 * Todo corre dentro de `begin; ... rollback;` — nunca se toca el dato de
 * seed de verdad, sea cual sea el resultado de la prueba. Cada llamada abre
 * una conexión `psql` nueva, así que no hay estado (rol, jwt) que se filtre
 * de una prueba a la siguiente.
 *
 * `role`: 'anon' (visitante sin sesión) o 'authenticated' (con `userId`).
 * Devuelve las filas de salida como array de strings (una línea por fila,
 * columnas separadas por `|` si la consulta trae más de una) — pensado para
 * SELECT/INSERT..RETURNING/UPDATE..RETURNING/DELETE..RETURNING sencillos,
 * no para inspeccionar resultados tabulares complejos.
 */
export function queryAs({ role = 'authenticated', userId = null, sql }) {
  const setup = [
    `set role ${role};`,
    userId ? `set request.jwt.claim.sub = '${userId}';` : '',
  ].join('\n');
  const full = `begin;\n${setup}\n${sql}\nrollback;`;

  try {
    const out = execFileSync(
      'psql', [DB_URL, '-q', '-t', '-A', '-F', '|', '-v', 'ON_ERROR_STOP=1', '-c', full],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
    return out.split('\n').filter((line) => line.length > 0);
  } catch (err) {
    // execFileSync adjunta stdout/stderr al error — se re-lanza con el texto
    // real de Postgres como mensaje, así `expectRlsError` puede inspeccionarlo.
    const detail = (err.stderr || err.message || '').toString();
    throw new Error(detail);
  }
}

/** Azúcar sobre `queryAs` para el caso más común: solo importa cuántas filas devuelve. */
export function countAs(args) {
  return queryAs(args).length;
}

/** Afirma que `fn()` (una llamada a `queryAs`) revienta por RLS/permisos, no por otra cosa. */
export function expectRlsError(fn) {
  try {
    fn();
  } catch (err) {
    if (/row-level security|permission denied|must be owner|insufficient privilege/i.test(err.message)) {
      return;
    }
    throw new Error(`Falló, pero no por RLS/permisos: ${err.message}`);
  }
  throw new Error('Se esperaba un error de RLS/permisos y no ocurrió');
}

// UUIDs fijos de `supabase/seed.sql` — mismos que ya se usan en el resto del
// proyecto para pruebas manuales por `psql` (ver BACKEND.md).
export const SEED = {
  CAMILA: '11111111-1111-1111-1111-111111111111', // investigacion@demo.cl · patrocinador · dueña de la org 001, perfil privado
  DIEGO: '22222222-2222-2222-2222-222222222222', // semilla@demo.cl · patrocinador · dueño de la org 002 (Fundación Semilla), perfil privado
  VALENTINA: '33333333-3333-3333-3333-333333333333', // estudiante@demo.cl · estudiante, perfil público
  MARCOS: '44444444-4444-4444-4444-444444444444', // moderacion@demo.cl · moderador puro
  ADMIN: '55555555-5555-5555-5555-555555555555', // admin@demo.cl
  ORG_CAMILA: 'a0000000-0000-0000-0000-000000000001',
  ORG_DIEGO: 'a0000000-0000-0000-0000-000000000002',
  APPLICATION_VALENTINA_EN_ORG_CAMILA: 'f0000000-0000-0000-0000-000000000001',
  ROLE_EN_ORG_CAMILA: 'c0000000-0000-0000-0000-000000000001',
  PROJECT_ORG_CAMILA: 'b0000000-0000-0000-0000-000000000001',
};
