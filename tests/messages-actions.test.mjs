import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, form } from './helpers.mjs';

test('un mensaje vacío no se envía', async () => {
  const { exports } = load('features/messages/actions.ts', { currentUser: { id: 'u1' } });
  const result = await exports.sendMessage({}, form({ projectId: 'p1', body: '   ' }));
  assert.match(result.error, /Escribe un mensaje/);
});

test('un mensaje de más de 2000 caracteres no se envía', async () => {
  const { exports } = load('features/messages/actions.ts', { currentUser: { id: 'u1' } });
  const result = await exports.sendMessage({}, form({ projectId: 'p1', body: 'x'.repeat(2001) }));
  assert.match(result.error, /demasiado largo/);
});

test('sin sesión no se puede enviar un mensaje', async () => {
  const { exports, queries } = load('features/messages/actions.ts');
  const result = await exports.sendMessage({}, form({ projectId: 'p1', body: 'Hola equipo' }));
  assert.match(result.error, /iniciar sesión/);
  assert.equal(queries.length, 0);
});

test('un mensaje válido se envía y revalida la ruta indicada', async () => {
  const { exports, paths } = load('features/messages/actions.ts', {
    currentUser: { id: 'u1' },
    responses: [{ error: null }],
  });
  const result = await exports.sendMessage({}, form({
    projectId: 'p1', body: 'Hola equipo', redirectPath: '/mis-proyectos/p1/seguimiento',
  }));
  assert.equal(result.error, undefined);
  assert.ok(paths.includes('/mis-proyectos/p1/seguimiento'));
});
