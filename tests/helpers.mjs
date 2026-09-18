import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const CHAIN_METHODS = [
  'select', 'insert', 'update', 'delete', 'eq', 'neq', 'in', 'ilike', 'not',
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
} = {}) {
  const paths = [];
  const queries = [];
  const rpcCalls = [];
  const emailCalls = [];
  const sendEmailCalls = [];
  const storageUploads = [];
  const storageRemoves = [];
  const adminAuthCalls = [];
  const uploadResponses = storageResponses.upload ?? [];
  const removeResponses = storageResponses.remove ?? [];
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
      if (name === '@/lib/supabase/server') return { createClient: async () => db };
      if (name === '@/features/auth/queries') return { getCurrentUser: async () => currentUser };
      if (name === '@/features/organizations/config') return { INVITACIONES_HABILITADAS: true };
      if (name === '@/features/admin/queries') return { CONFIG_CAMPO_LABEL: {} };
      if (name === '@/lib/supabase/admin') {
        return {
          createAdminClient: () => ({
            auth: {
              admin: {
                async updateUserById(userId, opts) {
                  adminAuthCalls.push({ userId, opts });
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
        };
      }
      if (name in extraModules) return extraModules[name];
      throw new Error(`Import inesperado: ${name}`);
    },
  });
  return {
    exports, paths, queries, rpcCalls, emailCalls, sendEmailCalls,
    storageUploads, storageRemoves, adminAuthCalls,
  };
}

export function form(values) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}
