import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const CHAIN_METHODS = [
  'select', 'insert', 'update', 'delete', 'eq', 'in', 'limit', 'order', 'maybeSingle', 'single',
];

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
} = {}) {
  const paths = [];
  const queries = [];
  const rpcCalls = [];
  const emailCalls = [];
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
  };
  const exports = {};
  const source = readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  vm.runInNewContext(outputText, {
    exports, console: { error() {} },
    require(name) {
      if (name === 'next/cache') return { revalidatePath: (path) => paths.push(path) };
      if (name === 'next/navigation') return { redirect: () => assert.fail('Redirección inesperada') };
      if (name === 'next/server') return { after: (fn) => { fn(); } };
      if (name === '@/lib/supabase/server') return { createClient: async () => db };
      if (name === '@/features/auth/queries') return { getCurrentUser: async () => currentUser };
      if (name === '@/features/notifications/email') {
        return { sendEmailToUser: async (...args) => { emailCalls.push(args); } };
      }
      throw new Error(`Import inesperado: ${name}`);
    },
  });
  return { exports, paths, queries, rpcCalls, emailCalls };
}

export function form(values) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}
