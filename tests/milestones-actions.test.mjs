import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, form } from './helpers.mjs';

test('un hito con orden negativo o no numérico no se guarda', async () => {
  const { exports } = load('features/milestones/actions.ts');
  const result = await exports.addMilestone({}, form({ projectId: 'p1', titulo: 'X', orden: '-1' }));
  assert.match(result.error, /entero de 0 o más/);
});

test('aprobar un hito entregado lo pasa a aprobado', async () => {
  const { exports, paths } = load('features/milestones/actions.ts', {
    responses: [{ error: null, count: 1 }],
  });
  const result = await exports.approveMilestone({}, form({ milestoneId: 'm1', projectId: 'p1' }));
  assert.equal(result.error, undefined);
  assert.ok(paths.includes('/mis-proyectos/p1'));
});

test('aprobar un hito que ya no está entregado (otro gestor ya actuó) avisa en vez de forzarlo', async () => {
  const { exports } = load('features/milestones/actions.ts', {
    responses: [{ error: null, count: 0 }],
  });
  const result = await exports.approveMilestone({}, form({ milestoneId: 'm1', projectId: 'p1' }));
  assert.match(result.error, /alguien más ya lo haya procesado/);
});

test('pedir cambios sobre un hito entregado lo devuelve a en_progreso', async () => {
  const { exports } = load('features/milestones/actions.ts', {
    responses: [{ error: null, count: 1 }],
  });
  const result = await exports.returnMilestone({}, form({ milestoneId: 'm1', projectId: 'p1' }));
  assert.equal(result.error, undefined);
});

test('pedir cambios sobre un hito que ya no está entregado no lo toca', async () => {
  const { exports } = load('features/milestones/actions.ts', {
    responses: [{ error: null, count: 0 }],
  });
  const result = await exports.returnMilestone({}, form({ milestoneId: 'm1', projectId: 'p1' }));
  assert.ok(result.error);
});

test('eliminar un hito funciona y actualiza la vista del proyecto', async () => {
  const { exports, paths } = load('features/milestones/actions.ts', {
    responses: [{ error: null }],
  });
  const result = await exports.deleteMilestone({}, form({ milestoneId: 'm1', projectId: 'p1' }));
  assert.equal(result.error, undefined);
  assert.ok(paths.includes('/mis-proyectos/p1'));
});

test('un error al eliminar un hito se muestra en vez de fallar en silencio', async () => {
  const { exports } = load('features/milestones/actions.ts', {
    responses: [{ error: { message: 'no autorizado' } }],
  });
  const result = await exports.deleteMilestone({}, form({ milestoneId: 'm1', projectId: 'p1' }));
  assert.ok(result.error);
});
