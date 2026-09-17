import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Ejecuta las acciones reales con respuestas de base de datos controladas.
// No usa credenciales ni modifica proyectos para comprobar las regresiones.
function load(relativePath, responses = []) {
  const paths = [];
  const queries = [];
  const db = {
    from(table) {
      const query = { table, steps: [] };
      queries.push(query);
      const chain = {};
      for (const method of ['select', 'insert', 'update', 'eq', 'maybeSingle', 'single']) {
        chain[method] = (...args) => { query.steps.push([method, ...args]); return chain; };
      }
      chain.then = (accept, reject) => {
        assert.ok(responses.length, 'Consulta inesperada');
        return Promise.resolve(responses.shift()).then(accept, reject);
      };
      return chain;
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
      if (name === '@/lib/supabase/server') return { createClient: async () => db };
      throw new Error(`Import inesperado: ${name}`);
    },
  });
  return { exports, paths, queries };
}

function form(values) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

test('el alta de hito confirma el título solo tras guardar', async () => {
  const { exports } = load('features/milestones/actions.ts', [{ error: null }, { error: { message: 'fallo' } }]);
  const data = form({ projectId: 'p1', titulo: 'Entrega final' });
  assert.equal((await exports.addMilestone({}, data)).created, 'Entrega final');
  const failed = await exports.addMilestone({}, data);
  assert.ok(failed.error);
  assert.equal(failed.created, undefined);
});

test('un rol creado informa el fallo parcial de sus habilidades sin invitar a duplicarlo', async () => {
  const { exports } = load('features/projects/actions.ts', [
    { data: { id: 'r1' }, error: null }, { error: { message: 'fallo' } },
  ]);
  const result = await exports.addRole({}, form({
    projectId: 'p1', nombre: 'Analista', cupos: '1',
    skills: JSON.stringify([{ skillId: 's1', nivel: 'basico' }]),
  }));
  assert.equal(result.created, 'Analista');
  assert.ok(result.warning);
  assert.equal(result.error, undefined);
});

test('cerrar proyecto confirma y actualiza las vistas del estudiante y organización', async () => {
  const { exports, paths, queries } = load('features/projects/actions.ts', [
    { data: { estado: 'entregado' } }, { error: null }, { data: [{ id: 'p1' }], error: null },
  ]);
  const result = await exports.closeProject({}, form({ projectId: 'p1', milestoneId: 'm1' }));
  assert.equal(result.ok, true);
  for (const path of ['/mis-proyectos/p1/validar', '/mis-proyectos/p1', '/mis-proyectos', '/proyecto', '/proyecto/p1', '/inicio']) {
    assert.ok(paths.includes(path), `Falta actualizar ${path}`);
  }
  assert.ok(queries[0].steps.some(([method, key, value]) => method === 'eq' && key === 'project_id' && value === 'p1'));
});

test('un hito ajeno o inexistente no permite cerrar ni mostrar éxito', async () => {
  const { exports, queries, paths } = load('features/projects/actions.ts', [{ data: null }]);
  const result = await exports.closeProject({}, form({ projectId: 'p1', milestoneId: 'ajeno' }));
  assert.ok(result.error);
  assert.equal(result.ok, undefined);
  assert.equal(queries.length, 1);
  assert.equal(paths.length, 0);
});

test('los estados terminales nunca se etiquetan como Activo', () => {
  const { exports } = load('features/projects/status.ts');
  assert.equal(exports.projectStatusLabel('completado'), 'Completado');
  assert.equal(exports.projectStatusLabel('cancelado'), 'Cancelado');
  assert.equal(exports.projectStatusLabel('activo'), 'Activo');
  assert.notEqual(exports.projectStatusLabel(null), 'Activo');
});
