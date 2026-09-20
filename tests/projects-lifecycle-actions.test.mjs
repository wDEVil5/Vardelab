import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, form, expectRedirect } from './helpers.mjs';

test('enviar a revisión un proyecto sin roles no se permite', async () => {
  const { exports } = load('features/projects/actions.ts', {
    responses: [{ count: 0 }],
  });
  const result = await exports.submitProjectForReview({}, form({ projectId: 'p1' }));
  assert.match(result.error, /al menos un rol/);
});

test('reenviar un proyecto rechazado antes exige responder al moderador', async () => {
  const { exports } = load('features/projects/actions.ts', {
    responses: [
      { count: 2 },
      { data: { comentario_moderacion: 'Falta detallar el alcance' } },
    ],
  });
  const result = await exports.submitProjectForReview({}, form({ projectId: 'p1' }));
  assert.match(result.error, /Responde al moderador/);
});

test('enviar a revisión un proyecto nuevo (sin comentario previo) no exige respuesta', async () => {
  const { exports } = load('features/projects/actions.ts', {
    responses: [
      { count: 2 },
      { data: { comentario_moderacion: null } },
      { error: null },
    ],
  });
  const result = await exports.submitProjectForReview({}, form({ projectId: 'p1' }));
  assert.equal(result.error, undefined);
});

test('aprobar un proyecto que ya no está en revisión no lo publica', async () => {
  const { exports } = load('features/projects/actions.ts', {
    responses: [{ data: [], error: null }],
  });
  const result = await exports.approveProject({}, form({ projectId: 'p1' }));
  assert.match(result.error, /ya no está en revisión/);
});

test('aprobar un proyecto en revisión lo publica y limpia las observaciones', async () => {
  const { exports, paths } = load('features/projects/actions.ts', {
    responses: [
      { data: [{ id: 'p1' }], error: null },
      { error: null },
    ],
  });
  const result = await exports.approveProject({}, form({ projectId: 'p1' }));
  assert.equal(result.error, undefined);
  assert.ok(paths.includes('/proyectos'));
});

test('rechazar un proyecto sin motivo no se permite', async () => {
  const { exports } = load('features/projects/actions.ts');
  const result = await exports.rejectProject({}, form({ projectId: 'p1', comentario: '' }));
  assert.match(result.error, /Deja un motivo/);
});

test('rechazar un proyecto con observaciones mal formadas no se aplica', async () => {
  const { exports } = load('features/projects/actions.ts');
  const result = await exports.rejectProject({}, form({
    projectId: 'p1', comentario: 'Falta trabajo', observaciones: '{no es un array}',
  }));
  assert.match(result.error, /algo no quedó bien formado/);
});

test('rechazar un proyecto en revisión lo devuelve a borrador con sus observaciones', async () => {
  const { exports } = load('features/projects/actions.ts', {
    responses: [
      { data: [{ id: 'p1', titulo: 'Proyecto X', org_id: 'org1' }], error: null },
      { error: null },
      { error: null },
    ],
    rpcResponses: [{ data: ['u2'], error: null }],
    currentUser: { id: 'u1' },
  });
  const result = await exports.rejectProject({}, form({
    projectId: 'p1', comentario: 'Falta detallar el alcance',
    observaciones: JSON.stringify([{ categoria: 'Alcance', texto: 'Sé más específico' }]),
  }));
  assert.equal(result.error, undefined);
});

test('cerrar un proyecto sin hito final entregado no se permite', async () => {
  const { exports } = load('features/projects/actions.ts', {
    responses: [{ data: { estado: 'en_progreso' } }],
  });
  const result = await exports.closeProject({}, form({ projectId: 'p1', milestoneId: 'm1' }));
  assert.match(result.error, /todavía no entregó/);
});

test('eliminar un proyecto publicado (no borrador) no se permite', async () => {
  const { exports } = load('features/projects/actions.ts', {
    responses: [{ data: { status: 'publicado' } }],
  });
  const result = await exports.deleteProject({}, form({ projectId: 'p1' }));
  assert.match(result.error, /Solo puedes eliminar un proyecto en borrador/);
});

test('eliminar un proyecto en borrador con postulaciones no se permite', async () => {
  const { exports } = load('features/projects/actions.ts', {
    responses: [
      { data: { status: 'borrador' } },
      { data: [{ id: 'r1' }] },
      { count: 1 },
    ],
  });
  const result = await exports.deleteProject({}, form({ projectId: 'p1' }));
  assert.match(result.error, /ya tiene postulaciones/);
});

test('eliminar un proyecto en borrador sin roles ni postulaciones funciona', async () => {
  const { exports } = load('features/projects/actions.ts', {
    responses: [
      { data: { status: 'borrador' } },
      { data: [] },
      { error: null },
    ],
  });
  const to = await expectRedirect(exports.deleteProject({}, form({ projectId: 'p1' })));
  assert.equal(to, '/mis-proyectos?eliminado=1');
});

test('cancelar un proyecto ya completado o cancelado no se reprocesa', async () => {
  const { exports } = load('features/projects/actions.ts', {
    responses: [{ data: [], error: null }],
  });
  const result = await exports.cancelProject({}, form({ projectId: 'p1' }));
  assert.match(result.error, /ya está completado o cancelado/);
});

test('cancelar un proyecto activo funciona', async () => {
  const { exports, paths } = load('features/projects/actions.ts', {
    responses: [
      { data: [{ id: 'p1', titulo: 'Proyecto X', org_id: 'org1' }], error: null },
      { data: { team_members: [{ user_id: 'u2' }] } },
    ],
    rpcResponses: [{ data: ['u3'], error: null }],
    currentUser: { id: 'u1' },
  });
  const result = await exports.cancelProject({}, form({ projectId: 'p1' }));
  assert.equal(result.error, undefined);
  assert.ok(paths.includes('/mis-proyectos'));
});
