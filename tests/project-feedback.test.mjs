import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, form } from './helpers.mjs';

test('el alta de hito confirma el título solo tras guardar', async () => {
  const { exports } = load('features/milestones/actions.ts', {
    responses: [{ error: null }, { error: { message: 'fallo' } }],
  });
  const data = form({ projectId: 'p1', titulo: 'Entrega final' });
  assert.equal((await exports.addMilestone({}, data)).created, 'Entrega final');
  const failed = await exports.addMilestone({}, data);
  assert.ok(failed.error);
  assert.equal(failed.created, undefined);
});

test('un rol creado informa el fallo parcial de sus habilidades sin invitar a duplicarlo', async () => {
  const { exports } = load('features/projects/actions.ts', {
    responses: [{ data: { id: 'r1' }, error: null }, { error: { message: 'fallo' } }],
  });
  const result = await exports.addRole({}, form({
    projectId: 'p1', nombre: 'Analista', cupos: '1',
    skills: JSON.stringify([{ skillId: 's1', nivel: 'basico' }]),
  }));
  assert.equal(result.created, 'Analista');
  assert.ok(result.warning);
  assert.equal(result.error, undefined);
});

test('cerrar proyecto confirma y actualiza las vistas del estudiante y organización', async () => {
  const { exports, paths, rpcCalls } = load('features/projects/actions.ts', {
    rpcResponses: [{ data: 'ok', error: null }],
  });
  const result = await exports.closeProject({}, form({ projectId: 'p1', milestoneId: 'm1' }));
  assert.equal(result.ok, true);
  for (const path of ['/mis-proyectos/p1/validar', '/mis-proyectos/p1', '/mis-proyectos', '/proyecto', '/proyecto/p1', '/inicio']) {
    assert.ok(paths.includes(path), `Falta actualizar ${path}`);
  }
  assert.equal(rpcCalls[0].name, 'close_project');
  assert.equal(rpcCalls[0].args._project_id, 'p1');
  assert.equal(rpcCalls[0].args._milestone_id, 'm1');
});

test('un hito ajeno o inexistente no permite cerrar ni mostrar éxito', async () => {
  const { exports, rpcCalls, paths } = load('features/projects/actions.ts', {
    rpcResponses: [{ data: 'sin_hito_final', error: null }],
  });
  const result = await exports.closeProject({}, form({ projectId: 'p1', milestoneId: 'ajeno' }));
  assert.ok(result.error);
  assert.equal(result.ok, undefined);
  assert.equal(rpcCalls.length, 1);
  assert.equal(paths.length, 0);
});

test('cerrar un proyecto sin evaluar a todo el equipo no se permite', async () => {
  const { exports, rpcCalls, paths } = load('features/projects/actions.ts', {
    rpcResponses: [{ data: 'faltan_evaluaciones', error: null }],
  });
  const result = await exports.closeProject({}, form({ projectId: 'p1', milestoneId: 'm1' }));
  assert.match(result.error, /Evalúa a todos los integrantes/);
  assert.equal(rpcCalls.length, 1);
  assert.equal(paths.length, 0);
});

test('los estados terminales nunca se etiquetan como Activo', () => {
  const { exports } = load('features/projects/status.ts');
  assert.equal(exports.projectStatusLabel('completado'), 'Completado');
  assert.equal(exports.projectStatusLabel('cancelado'), 'Cancelado');
  assert.equal(exports.projectStatusLabel('activo'), 'Activo');
  assert.notEqual(exports.projectStatusLabel(null), 'Activo');
});
