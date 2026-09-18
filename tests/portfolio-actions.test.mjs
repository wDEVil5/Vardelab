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
