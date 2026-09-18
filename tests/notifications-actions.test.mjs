import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, form } from './helpers.mjs';

test('marcar una notificación leída sin id no toca la base', async () => {
  const { exports, queries } = load('features/notifications/actions.ts');
  await exports.markNotificationRead(form({}));
  assert.equal(queries.length, 0);
});

test('marcar una notificación leída funciona', async () => {
  const { exports, queries } = load('features/notifications/actions.ts', {
    responses: [{ error: null }],
  });
  await exports.markNotificationRead(form({ id: 'n1' }));
  const update = queries[0].steps.find(([m]) => m === 'update');
  assert.equal(update[1].leida, true);
});

test('marcar todas leídas sin sesión no toca la base', async () => {
  const { exports, queries } = load('features/notifications/actions.ts');
  await exports.markAllNotificationsRead();
  assert.equal(queries.length, 0);
});

test('marcar todas leídas con sesión solo afecta las propias y no leídas', async () => {
  const { exports, queries } = load('features/notifications/actions.ts', {
    currentUser: { id: 'u1' },
    responses: [{ error: null }],
  });
  await exports.markAllNotificationsRead();
  const steps = queries[0].steps;
  assert.ok(steps.some(([m, k, v]) => m === 'eq' && k === 'user_id' && v === 'u1'));
  assert.ok(steps.some(([m, k, v]) => m === 'eq' && k === 'leida' && v === false));
});
