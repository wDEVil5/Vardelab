import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, form } from './helpers.mjs';

test('aceptar una postulación avisa por correo cuando la función atómica confirma "ok"', async () => {
  const { exports, paths, emailCalls } = load('features/applications/actions.ts', {
    rpcResponses: [{ data: 'ok', error: null }],
    responses: [{
      data: { applicant_id: 'u1', role: { project: { titulo: 'Rediseño del sitio' } } },
    }],
  });
  const result = await exports.acceptApplication({}, form({ applicationId: 'a1', projectId: 'p1' }));
  assert.equal(result.error, undefined);
  assert.ok(paths.includes('/mis-proyectos/p1/postulaciones'));
  assert.equal(emailCalls.length, 1);
  assert.equal(emailCalls[0][0], 'u1');
  assert.equal(emailCalls[0][1], 'postulacion_aceptada');
});

test('aceptar una postulación sin cupos no manda correo y muestra el motivo real', async () => {
  const { exports, emailCalls } = load('features/applications/actions.ts', {
    rpcResponses: [{ data: 'sin_cupos', error: null }],
  });
  const result = await exports.acceptApplication({}, form({ applicationId: 'a1', projectId: 'p1' }));
  assert.match(result.error, /cupos/);
  assert.equal(emailCalls.length, 0);
});

test('aceptar una postulación ya procesada por otro gestor no la reprocesa', async () => {
  const { exports } = load('features/applications/actions.ts', {
    rpcResponses: [{ data: 'ya_procesada', error: null }],
  });
  const result = await exports.acceptApplication({}, form({ applicationId: 'a1', projectId: 'p1' }));
  assert.match(result.error, /ya fue procesada/);
});

test('un error de la función atómica de aceptar se muestra sin reventar', async () => {
  const { exports } = load('features/applications/actions.ts', {
    rpcResponses: [{ data: null, error: { message: 'timeout' } }],
  });
  const result = await exports.acceptApplication({}, form({ applicationId: 'a1', projectId: 'p1' }));
  assert.ok(result.error);
});

test('rechazar una postulación enviada la cierra y avisa al postulante', async () => {
  const { exports, emailCalls } = load('features/applications/actions.ts', {
    responses: [
      { data: { applicant_id: 'u1', role: { project: { titulo: 'Rediseño del sitio' } } } },
      { error: null, count: 1 },
    ],
  });
  const result = await exports.rejectApplication({}, form({ applicationId: 'a1', projectId: 'p1' }));
  assert.equal(result.error, undefined);
  assert.equal(emailCalls.length, 1);
  assert.equal(emailCalls[0][1], 'postulacion_rechazada');
});

test('rechazar una postulación que ya no está "enviada" no manda correo ni la vuelve a tocar', async () => {
  const { exports, emailCalls } = load('features/applications/actions.ts', {
    responses: [
      { data: null }, // ya no matchea status = 'enviada'
      { error: null, count: 0 },
    ],
  });
  const result = await exports.rejectApplication({}, form({ applicationId: 'a1', projectId: 'p1' }));
  assert.match(result.error, /ya fue procesada/);
  assert.equal(emailCalls.length, 0);
});

test('confirmar equipo sin integrantes no permite cerrar la selección', async () => {
  const { exports } = load('features/applications/actions.ts', {
    responses: [{ data: { id: 't1', team_members: [] } }],
  });
  const result = await exports.confirmTeam({}, form({ projectId: 'p1' }));
  assert.match(result.error, /al menos un integrante/);
});

test('confirmar equipo con integrantes pasa el proyecto a activo', async () => {
  const { exports, paths } = load('features/applications/actions.ts', {
    responses: [
      { data: { id: 't1', team_members: [{ id: 'tm1' }] } },
      { data: [{ id: 'p1' }], error: null },
    ],
  });
  const result = await exports.confirmTeam({}, form({ projectId: 'p1' }));
  assert.equal(result.error, undefined);
  assert.ok(paths.includes('/mis-proyectos'));
});

test('confirmar equipo cuando el proyecto ya no está en selección no lo reactiva', async () => {
  const { exports } = load('features/applications/actions.ts', {
    responses: [
      { data: { id: 't1', team_members: [{ id: 'tm1' }] } },
      { data: [], error: null },
    ],
  });
  const result = await exports.confirmTeam({}, form({ projectId: 'p1' }));
  assert.ok(result.error);
});

test('quitar a alguien del equipo libera su cupo y avisa por correo', async () => {
  const { exports, emailCalls, queries } = load('features/applications/actions.ts', {
    responses: [
      { data: { user_id: 'u1', project_role_id: 'r1' } }, // team_members select
      { error: null },                                     // team_members delete
      { error: null },                                     // applications update -> 'removida'
      { data: { titulo: 'Rediseño del sitio' } },           // projects select
    ],
  });
  const result = await exports.removeTeamMember({}, form({ teamMemberId: 'tm1', projectId: 'p1' }));
  assert.equal(result.error, undefined);
  assert.equal(emailCalls.length, 1);
  assert.equal(emailCalls[0][1], 'postulacion_removida');
  const updateAplicacion = queries.find((q) => q.table === 'applications');
  assert.ok(updateAplicacion.steps.some(([m, v]) => m === 'update' && v.status === 'removida'));
});

test('quitar a un integrante inexistente no intenta borrar nada', async () => {
  const { exports, queries } = load('features/applications/actions.ts', {
    responses: [{ data: null }],
  });
  const result = await exports.removeTeamMember({}, form({ teamMemberId: 'ajeno', projectId: 'p1' }));
  assert.ok(result.error);
  assert.equal(queries.length, 1);
});
