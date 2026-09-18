import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, form } from './helpers.mjs';

const USER = { id: 'u1' };

test('evaluar sin completar los tres criterios no se guarda', async () => {
  const { exports } = load('features/evaluations/actions.ts', { currentUser: USER });
  const result = await exports.evaluateMember({}, form({
    projectId: 'p1', evaluateeId: 'e1', calidad: '5', colaboracion: '4',
  }));
  assert.match(result.error, /los tres criterios/);
});

test('el puntaje se calcula como el promedio redondeado de los tres criterios', async () => {
  const { exports, queries } = load('features/evaluations/actions.ts', {
    currentUser: USER,
    responses: [{ data: null }, { error: null }, { data: { titulo: 'App de tareas' } }],
  });
  const result = await exports.evaluateMember({}, form({
    projectId: 'p1', evaluateeId: 'e1', calidad: '5', colaboracion: '4', cumplimientoHitos: '4',
  }));
  assert.equal(result.ok, true);
  const upsert = queries
    .filter((q) => q.table === 'evaluations')
    .flatMap((q) => q.steps)
    .find(([m]) => m === 'upsert');
  assert.equal(upsert[1].puntaje, 4); // (5+4+4)/3 = 4.33 -> 4
});

test('re-evaluar (ya existía una evaluación) no manda correo de nuevo', async () => {
  const { exports, emailCalls } = load('features/evaluations/actions.ts', {
    currentUser: USER,
    responses: [{ data: { id: 'ev1' } }, { error: null }],
  });
  const result = await exports.evaluateMember({}, form({
    projectId: 'p1', evaluateeId: 'e1', calidad: '5', colaboracion: '5', cumplimientoHitos: '5',
  }));
  assert.equal(result.ok, true);
  assert.equal(emailCalls.length, 0);
});
