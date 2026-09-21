import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const CHAIN_METHODS = [
  'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'in', 'ilike', 'not',
  'limit', 'order', 'maybeSingle', 'single',
];

/**
 * `redirect()` real de Next.js corta la ejecución lanzando (no devuelve). Se
 * imita igual acá: siempre lanza esta señal (nunca falla la prueba por sí
 * sola) y `expectRedirect` de más abajo es quien decide si eso era lo
 * esperado o no.
 */
class RedirectSignal extends Error {
  constructor(to) {
    super(`Redirección inesperada a "${to}"`);
    this.to = to;
  }
}

/** Envuelve una llamada que debería terminar en `redirect(to)`. Devuelve `to`. */
export async function expectRedirect(promise) {
  try {
    await promise;
  } catch (err) {
    if (err instanceof RedirectSignal) return err.to;
    throw err;
  }
  assert.fail('Se esperaba una redirección y no ocurrió');
}

/**
 * Ejecuta una Server Action real (transpilada de TS) con respuestas de base de
 * datos controladas — sin credenciales, sin tocar Postgres. Compartido por
 * todos los `tests/*.test.mjs`: cada acción real importa sus propias
 * dependencias (`next/cache`, `@/lib/supabase/server`, etc.), así que este
 * helper stubea las que se van necesitando a medida que se prueban más
 * acciones, en vez de que cada archivo de test reimplemente su propio mock.
 */
export function load(relativePath, {
  responses = [],
  rpcResponses = [],
  currentUser = null,
  storageResponses = {},
  extraModules = {},
  adminAuthResponses = [],
  authResponses = {},
  rateLimitOk = true,
} = {}) {
  const paths = [];
  const queries = [];
  const rpcCalls = [];
  const emailCalls = [];
  const sendEmailCalls = [];
  const storageUploads = [];
  const storageRemoves = [];
  const adminAuthCalls = [];
  const authCalls = [];
  const rateLimitCalls = [];
  const uploadResponses = storageResponses.upload ?? [];
  const removeResponses = storageResponses.remove ?? [];
  // `rateLimitOk`: `true` (default) deja pasar todo; `false` bloquea todo;
  // un array se consume en orden para simular, por ejemplo, que el segundo
  // chequeo (por correo) bloquee aunque el primero (por IP) haya pasado.
  const rateLimitQueue = Array.isArray(rateLimitOk) ? [...rateLimitOk] : null;
  function nextAuthResponse(method) {
    const queue = authResponses[method];
    if (queue && queue.length) return queue.shift();
    return { data: {}, error: null };
  }
  const db = {
    from(table) {
      const query = { table, steps: [] };
      queries.push(query);
      const chain = {};
      for (const method of CHAIN_METHODS) {
        chain[method] = (...args) => { query.steps.push([method, ...args]); return chain; };
      }
      chain.then = (accept, reject) => {
        assert.ok(responses.length, `Consulta inesperada sobre "${table}"`);
        return Promise.resolve(responses.shift()).then(accept, reject);
      };
      return chain;
    },
    rpc(name, args) {
      rpcCalls.push({ name, args });
      assert.ok(rpcResponses.length, `Llamada RPC inesperada a "${name}"`);
      return Promise.resolve(rpcResponses.shift());
    },
    auth: {
      async getUser() {
        return { data: { user: currentUser } };
      },
      async signUp(args) {
        authCalls.push({ method: 'signUp', args });
        return nextAuthResponse('signUp');
      },
      async signInWithPassword(args) {
        authCalls.push({ method: 'signInWithPassword', args });
        return nextAuthResponse('signInWithPassword');
      },
      async signOut() {
        authCalls.push({ method: 'signOut' });
        return nextAuthResponse('signOut');
      },
      async resetPasswordForEmail(email, opts) {
        authCalls.push({ method: 'resetPasswordForEmail', args: { email, opts } });
        return nextAuthResponse('resetPasswordForEmail');
      },
      async updateUser(attrs, opts) {
        authCalls.push({ method: 'updateUser', args: { attrs, opts } });
        return nextAuthResponse('updateUser');
      },
    },
    storage: {
      from(bucket) {
        return {
          async upload(path, file, opts) {
            storageUploads.push({ bucket, path, opts });
            return uploadResponses.shift() ?? { error: null };
          },
          async remove(pathsToRemove) {
            storageRemoves.push({ bucket, paths: pathsToRemove });
            return removeResponses.shift() ?? { error: null };
          },
          getPublicUrl(path) {
            return { data: { publicUrl: `https://fake.local/storage/${bucket}/${path}` } };
          },
        };
      },
    },
  };
  const exports = {};
  const source = readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  vm.runInNewContext(outputText, {
    exports, console: { error() {} },
    // `File`/`FormData`: algunas acciones hacen `archivo instanceof File`. El
    // contexto del vm no hereda los globals de Node, así que sin esto ese
    // chequeo revienta con "File is not defined" en vez de evaluar bien.
    File, FormData,
    require(name) {
      if (name === 'next/cache') return { revalidatePath: (path) => paths.push(path) };
      if (name === 'next/navigation') return { redirect: (to) => { throw new RedirectSignal(to); } };
      if (name === 'next/server') return { after: (fn) => { fn(); } };
      if (name === 'next/headers') {
        return { headers: async () => ({ get: () => null }) };
      }
      // `cache()` de React memoiza por render; en un test cada `load()` ya es
      // una carga aislada de por sí, así que la identidad basta (no hace
      // falta reproducir la memoización real para probar el comportamiento).
      if (name === 'react') return { cache: (fn) => fn };
      if (name === '@/lib/supabase/server') return { createClient: async () => db };
      if (name === '@/features/auth/queries') {
        return {
          getCurrentUser: async () => currentUser,
          // Simula `requireUser`: mismo `currentUser` de esta carga de test.
          // Sin sesión, dispara la misma señal de redirect que usa `redirect()`.
          requireUser: async (_supabase, next) => {
            if (!currentUser) throw new RedirectSignal(next ? `/ingresar?next=${next}` : '/ingresar');
            return currentUser;
          },
        };
      }
      if (name === '@/features/auth/constants') return { POST_AUTH_REDIRECT: '/inicio' };
      if (name === '@/features/organizations/config') return { INVITACIONES_HABILITADAS: true };
      if (name === '@/features/organizations/queries' && !('@/features/organizations/queries' in extraModules)) {
        return { getMyOrgIds: async () => [] };
      }
      if (name === '@/features/admin/queries') return { CONFIG_CAMPO_LABEL: {} };
      if (name === '@/lib/site') return { SITE_URL: 'https://vardelab.test' };
      if (name === '@/features/auth/password') {
        // Misma regla que `features/auth/password.ts`: 8+ caracteres,
        // mayúscula, minúscula y número. Se reimplementa acá (no se
        // importa el archivo real) porque el helper solo puede requerir
        // módulos que él mismo resuelve.
        return {
          isPasswordValid: (pw) =>
            typeof pw === 'string' && pw.length >= 8 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw),
        };
      }
      if (name === '@/lib/rate-limit') {
        return {
          RATE_LIMIT_MESSAGE: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
          getClientIp: async () => '203.0.113.1',
          checkRateLimit: async (scope, identifier) => {
            rateLimitCalls.push({ scope, identifier });
            if (rateLimitQueue) return rateLimitQueue.length ? rateLimitQueue.shift() : true;
            return rateLimitOk;
          },
        };
      }
      if (name === '@/lib/supabase/admin') {
        return {
          createAdminClient: () => ({
            auth: {
              admin: {
                async updateUserById(userId, opts) {
                  adminAuthCalls.push({ userId, opts });
                  return adminAuthResponses.shift() ?? { error: null };
                },
                async deleteUser(userId) {
                  adminAuthCalls.push({ method: 'deleteUser', userId });
                  return adminAuthResponses.shift() ?? { error: null };
                },
              },
            },
          }),
        };
      }
      if (name === '@/features/notifications/email') {
        return {
          sendEmailToUser: async (...args) => { emailCalls.push(args); },
          sendEmail: async (...args) => { sendEmailCalls.push(args); },
          sendPlainEmail: async (...args) => { sendEmailCalls.push(args); },
        };
      }
      if (name in extraModules) return extraModules[name];
      throw new Error(`Import inesperado: ${name}`);
    },
  });
  return {
    exports, paths, queries, rpcCalls, emailCalls, sendEmailCalls,
    storageUploads, storageRemoves, adminAuthCalls, authCalls, rateLimitCalls,
  };
}

export function form(values) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}
