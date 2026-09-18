import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, form, expectRedirect } from './helpers.mjs';

const USER = { id: 'u1' };

test('crear un proyecto sin problema/alcance/entregable no se guarda', async () => {
  const { exports } = load('features/projects/actions.ts', { currentUser: USER });
  const result = await exports.createProject({}, form({
    orgId: 'o1', titulo: 'App de tareas', modalidad: 'remoto', problema: '', alcance: 'X', entregable: 'Y',
  }));
  assert.match(result.error, /problema, alcance y entregable/);
});

test('crear un proyecto con una duración fuera de 1-52 semanas se rechaza', async () => {
  const { exports } = load('features/projects/actions.ts', { currentUser: USER });
  const result = await exports.createProject({}, form({
    orgId: 'o1', titulo: 'X', modalidad: 'remoto', problema: 'p', alcance: 'a', entregable: 'e',
    duracion_semanas: '60',
  }));
  assert.match(result.error, /entre 1 y 52/);
});

test('crear un proyecto válido redirige al listado', async () => {
  const { exports } = load('features/projects/actions.ts', {
    currentUser: USER,
    responses: [{ error: null }],
  });
  const to = await expectRedirect(exports.createProject({}, form({
    orgId: 'o1', titulo: 'App de tareas', modalidad: 'remoto', problema: 'p', alcance: 'a', entregable: 'e',
  })));
  assert.equal(to, '/mis-proyectos?creado=1');
});

test('editar un proyecto con una modalidad inválida no se guarda', async () => {
  const { exports } = load('features/projects/actions.ts');
  const result = await exports.updateProject({}, form({
    projectId: 'p1', titulo: 'X', modalidad: 'teletransporte', problema: 'p', alcance: 'a', entregable: 'e',
  }));
  assert.match(result.error, /modalidad válida/);
});

test('agregar un rol con habilidades mal formadas no crea nada', async () => {
  const { exports } = load('features/projects/actions.ts');
  const result = await exports.addRole({}, form({
    projectId: 'p1', nombre: 'Backend', cupos: '1', skills: '{no es un array}',
  }));
  assert.match(result.error, /algo no quedó bien formado/);
});

test('agregar un rol con cupos en 0 se rechaza', async () => {
  const { exports } = load('features/projects/actions.ts');
  const result = await exports.addRole({}, form({ projectId: 'p1', nombre: 'Backend', cupos: '0' }));
  assert.match(result.error, /entero de 1 o más/);
});

test('editar un rol no deja bajar los cupos por debajo de las personas ya aceptadas', async () => {
  const { exports } = load('features/projects/actions.ts', {
    responses: [{ count: 3 }],
  });
  const result = await exports.updateRole({}, form({
    roleId: 'r1', projectId: 'p1', nombre: 'Backend', cupos: '2',
  }));
  assert.match(result.error, /Ya hay 3 personas aceptadas/);
});

test('editar un rol con cupos suficientes para lo ya aceptado funciona', async () => {
  const { exports } = load('features/projects/actions.ts', {
    responses: [{ count: 2 }, { error: null }],
  });
  const result = await exports.updateRole({}, form({
    roleId: 'r1', projectId: 'p1', nombre: 'Backend', cupos: '2',
  }));
  assert.equal(result.error, undefined);
});

test('eliminar un rol con postulaciones activas no lo deja borrar', async () => {
  const { exports } = load('features/projects/actions.ts', {
    responses: [{ count: 1 }],
  });
  const result = await exports.deleteRole({}, form({ roleId: 'r1', projectId: 'p1' }));
  assert.match(result.error, /postulaciones activas/);
});

test('eliminar un rol sin postulaciones activas funciona', async () => {
  const { exports } = load('features/projects/actions.ts', {
    responses: [{ count: 0 }, { error: null }],
  });
  const result = await exports.deleteRole({}, form({ roleId: 'r1', projectId: 'p1' }));
  assert.equal(result.error, undefined);
});

test('agregar una habilidad repetida a un rol no se duplica', async () => {
  const { exports } = load('features/projects/actions.ts', {
    responses: [{ error: { code: '23505', message: 'duplicate key' } }],
  });
  const result = await exports.addRoleSkill({}, form({
    projectId: 'p1', roleId: 'r1', skillId: 's1', nivel: 'basico',
  }));
  assert.match(result.error, /ya está en el rol/);
});

test('quitar una habilidad de un rol funciona', async () => {
  const { exports, paths } = load('features/projects/actions.ts', {
    responses: [{ error: null }],
  });
  const result = await exports.deleteRoleSkill({}, form({ projectId: 'p1', roleId: 'r1', skillId: 's1' }));
  assert.equal(result.error, undefined);
  assert.ok(paths.includes('/mis-proyectos/p1'));
});
