import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, form } from './helpers.mjs';

test('un lead con correo mal formado no se guarda', async () => {
  const { exports } = load('features/leads/actions.ts');
  const result = await exports.submitLead({}, form({
    tipo: 'contacto_organizacion', nombre: 'X', email: 'no-es-un-correo', mensaje: 'Hola',
  }));
  assert.match(result.error, /correo válido/);
});

test('un lead válido se guarda y manda dos correos (confirmación + aviso interno)', async () => {
  const { exports, sendEmailCalls } = load('features/leads/actions.ts', {
    responses: [{ error: null }],
  });
  const result = await exports.submitLead({}, form({
    tipo: 'propuesta_desafio', nombre: 'Valentina', email: 'v@x.cl', mensaje: 'Quiero proponer un desafío',
  }));
  assert.equal(result.ok, true);
  assert.equal(sendEmailCalls.length, 2);
  assert.equal(sendEmailCalls[0][0], 'v@x.cl');
  assert.equal(sendEmailCalls[1][0], 'wilnesdevil9@gmail.com');
});

test('cambiar el estado de un lead a un valor inválido no lo toca', async () => {
  const { exports, queries } = load('features/leads/actions.ts', { currentUser: { id: 'staff1' } });
  await exports.updateLeadStatus(form({ leadId: 'l1', estado: 'inventado' }));
  assert.equal(queries.length, 0);
});

test('cambiar el estado de un lead a uno válido funciona', async () => {
  const { exports, paths } = load('features/leads/actions.ts', {
    currentUser: { id: 'staff1' },
    responses: [{ error: null }],
  });
  await exports.updateLeadStatus(form({ leadId: 'l1', estado: 'contactado' }));
  assert.ok(paths.includes('/leads'));
});
