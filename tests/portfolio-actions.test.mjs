import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, form } from './helpers.mjs';

const USER = { id: 'u1' };

test('una evidencia sin título no se guarda', async () => {
  const { exports } = load('features/portfolio/actions.ts', { currentUser: USER });
  const result = await exports.addPortfolioItem({}, form({ titulo: '' }));
  assert.match(result.error, /necesita un título/);
});

test('una evidencia marcada como pública nace con visibility "publico"', async () => {
  const { exports, queries } = load('features/portfolio/actions.ts', {
    currentUser: USER,
    responses: [{ error: null }],
  });
  const result = await exports.addPortfolioItem({}, form({ titulo: 'App de tareas', publico: 'on' }));
  assert.equal(result.success, true);
  const insert = queries[0].steps.find(([m]) => m === 'insert');
  assert.equal(insert[1].visibility, 'publico');
});

test('una evidencia sin marcar nace privada', async () => {
  const { exports, queries } = load('features/portfolio/actions.ts', {
    currentUser: USER,
    responses: [{ error: null }],
  });
  await exports.addPortfolioItem({}, form({ titulo: 'App de tareas' }));
  const insert = queries[0].steps.find(([m]) => m === 'insert');
  assert.equal(insert[1].visibility, 'privado');
});

test('eliminar una evidencia sin sesión no revienta', async () => {
  const { exports, queries } = load('features/portfolio/actions.ts');
  const result = await exports.deletePortfolioItem({}, form({ itemId: 'i1' }));
  assert.match(result.error, /sesión expiró/);
  assert.equal(queries.length, 0);
});

test('eliminar una evidencia propia funciona', async () => {
  const { exports } = load('features/portfolio/actions.ts', {
    currentUser: USER,
    responses: [{ error: null }],
  });
  const result = await exports.deletePortfolioItem({}, form({ itemId: 'i1' }));
  assert.equal(result.success, true);
});

// M102: `project_id` manipulado — un usuario que no integró el proyecto no
// puede ligar una evidencia a él, sin importar si la marca pública o no.
test('ligar una evidencia a un proyecto ajeno no se permite', async () => {
  const { exports, rpcCalls, queries } = load('features/portfolio/actions.ts', {
    currentUser: USER,
    rpcResponses: [{ data: false, error: null }],
  });
  const result = await exports.addPortfolioItem(
    {},
    form({ titulo: 'App', projectId: 'ajeno' }),
  );
  assert.match(result.error, /participaste/);
  assert.equal(rpcCalls[0].name, 'is_project_member');
  assert.equal(rpcCalls[0].args._project_id, 'ajeno');
  assert.equal(queries.length, 0);
});

test('ligar una evidencia pública a un proyecto sin permiso de divulgación no se permite', async () => {
  const { exports } = load('features/portfolio/actions.ts', {
    currentUser: USER,
    rpcResponses: [{ data: true, error: null }],
    responses: [{ data: { autoriza_divulgacion: false }, error: null }],
  });
  const result = await exports.addPortfolioItem(
    {},
    form({ titulo: 'App', projectId: 'p1', publico: 'on' }),
  );
  assert.match(result.error, /no autorizó publicar/);
});

test('ligar una evidencia privada a un proyecto sin permiso de divulgación sí se permite', async () => {
  const { exports, queries } = load('features/portfolio/actions.ts', {
    currentUser: USER,
    rpcResponses: [{ data: true, error: null }],
    responses: [{ error: null }],
  });
  const result = await exports.addPortfolioItem(
    {},
    form({ titulo: 'App', projectId: 'p1' }),
  );
  assert.equal(result.success, true);
  const insert = queries[0].steps.find(([m]) => m === 'insert');
  assert.equal(insert[1].visibility, 'privado');
});

test('ligar una evidencia pública a un proyecto con permiso de divulgación funciona', async () => {
  const { exports } = load('features/portfolio/actions.ts', {
    currentUser: USER,
    rpcResponses: [{ data: true, error: null }],
    responses: [
      { data: { autoriza_divulgacion: true }, error: null },
      { error: null },
    ],
  });
  const result = await exports.addPortfolioItem(
    {},
    form({ titulo: 'App', projectId: 'p1', publico: 'on' }),
  );
  assert.equal(result.success, true);
});

test('activar visibilidad pública de una evidencia sin proyecto no requiere autorización', async () => {
  const { exports, queries } = load('features/portfolio/actions.ts', {
    currentUser: USER,
    responses: [{ data: { project_id: null }, error: null }, { error: null }],
  });
  await exports.togglePortfolioItemVisibility(
    form({ itemId: 'i1', visibility: 'publico' }),
  );
  assert.equal(queries.length, 2);
  const update = queries[1].steps.find(([m]) => m === 'update');
  assert.equal(update[1].visibility, 'publico');
});

test('activar visibilidad pública de una evidencia con proyecto sin autorización no hace nada', async () => {
  const { exports, queries } = load('features/portfolio/actions.ts', {
    currentUser: USER,
    responses: [
      { data: { project_id: 'p1' }, error: null },
      { data: { autoriza_divulgacion: false }, error: null },
    ],
  });
  await exports.togglePortfolioItemVisibility(
    form({ itemId: 'i1', visibility: 'publico' }),
  );
  assert.equal(queries.length, 2);
  assert.ok(!queries.some((q) => q.steps.some(([m]) => m === 'update')));
});
