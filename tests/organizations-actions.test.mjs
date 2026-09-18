import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, form, expectRedirect } from './helpers.mjs';

const PATROCINADOR = { id: 'u1', esPatrocinador: true };
const ESTUDIANTE = { id: 'u2', esPatrocinador: false };

test('crear organización rechaza un tipo inválido', async () => {
  const { exports } = load('features/organizations/actions.ts');
  const result = await exports.createOrganization({}, form({ nombre: 'Fundación X', tipo: 'inventado' }));
  assert.match(result.error, /tipo de organización válido/);
});

test('una cuenta sin rol de patrocinador no puede crear una organización', async () => {
  const { exports } = load('features/organizations/actions.ts', { currentUser: ESTUDIANTE });
  const result = await exports.createOrganization({}, form({ nombre: 'Fundación X', tipo: 'social' }));
  assert.match(result.error, /cuentas de patrocinador/);
});

test('crear una organización válida redirige al listado', async () => {
  const { exports } = load('features/organizations/actions.ts', {
    currentUser: PATROCINADOR,
    responses: [{ error: null }],
  });
  const to = await expectRedirect(
    exports.createOrganization({}, form({ nombre: 'Fundación X', tipo: 'social' })),
  );
  assert.equal(to, '/mis-organizaciones?creada=1');
});

test('eliminar una organización con proyectos no la deja borrar', async () => {
  const { exports } = load('features/organizations/actions.ts', {
    responses: [{ count: 2 }],
  });
  const result = await exports.deleteOrganization({}, form({ orgId: 'o1' }));
  assert.match(result.error, /con proyectos/);
});

test('eliminar una organización sin proyectos sí la borra', async () => {
  const { exports } = load('features/organizations/actions.ts', {
    responses: [{ count: 0 }, { error: null }],
  });
  const to = await expectRedirect(exports.deleteOrganization({}, form({ orgId: 'o1' })));
  assert.equal(to, '/mis-organizaciones?eliminada=1');
});

test('el logo de una organización rechaza un formato no admitido', async () => {
  const { exports, storageUploads } = load('features/organizations/actions.ts', {
    currentUser: PATROCINADOR,
  });
  const logo = new File(['x'], 'logo.svg', { type: 'image/svg+xml' });
  const result = await exports.uploadOrgLogo({}, form({ orgId: 'o1', logo }));
  assert.match(result.error, /Formato no admitido/);
  assert.equal(storageUploads.length, 0);
});

test('el logo de una organización rechaza más de 2 MB', async () => {
  const { exports, storageUploads } = load('features/organizations/actions.ts', {
    currentUser: PATROCINADOR,
  });
  const grande = new Uint8Array(2 * 1024 * 1024 + 1);
  const logo = new File([grande], 'logo.png', { type: 'image/png' });
  const result = await exports.uploadOrgLogo({}, form({ orgId: 'o1', logo }));
  assert.match(result.error, /2 MB/);
  assert.equal(storageUploads.length, 0);
});

test('subir un logo válido lo guarda y actualiza la organización', async () => {
  const { exports, storageUploads } = load('features/organizations/actions.ts', {
    currentUser: PATROCINADOR,
    responses: [{ error: null }],
  });
  const logo = new File(['x'], 'logo.png', { type: 'image/png' });
  const result = await exports.uploadOrgLogo({}, form({ orgId: 'o1', logo }));
  assert.equal(result.error, undefined);
  assert.equal(storageUploads.length, 1);
  assert.equal(storageUploads[0].bucket, 'org-logos');
});

test('invitar con un correo mal formado no llega a tocar la base', async () => {
  const { exports, queries } = load('features/organizations/actions.ts', {
    currentUser: PATROCINADOR,
  });
  const result = await exports.inviteOrganizationMember({}, form({ orgId: 'o1', email: 'no-es-un-correo' }));
  assert.match(result.error, /correo válido/);
  assert.equal(queries.length, 0);
});

test('invitar a alguien que ya tiene cuenta queda activo de una y le manda correo', async () => {
  const { exports, sendEmailCalls, paths } = load('features/organizations/actions.ts', {
    currentUser: PATROCINADOR,
    rpcResponses: [{ data: 'u9', error: null }],
    responses: [{ error: null }, { data: { nombre: 'Fundación Semilla' } }],
  });
  const result = await exports.inviteOrganizationMember({}, form({ orgId: 'o1', email: 'nueva@correo.cl' }));
  assert.equal(result.ok, true);
  assert.equal(sendEmailCalls.length, 1);
  assert.equal(sendEmailCalls[0][3], '/mis-organizaciones/o1/miembros');
  assert.ok(paths.includes('/mis-organizaciones/o1/miembros'));
});

test('invitar a alguien sin cuenta todavía queda pendiente y el correo manda a /registro', async () => {
  const { exports, sendEmailCalls } = load('features/organizations/actions.ts', {
    currentUser: PATROCINADOR,
    rpcResponses: [{ data: null, error: null }],
    responses: [{ error: null }, { data: { nombre: 'Fundación Semilla' } }],
  });
  const result = await exports.inviteOrganizationMember({}, form({ orgId: 'o1', email: 'nueva@correo.cl' }));
  assert.equal(result.ok, true);
  assert.equal(sendEmailCalls[0][3], '/registro');
});

test('invitar un correo ya invitado a la misma organización no se duplica', async () => {
  const { exports } = load('features/organizations/actions.ts', {
    currentUser: PATROCINADOR,
    rpcResponses: [{ data: null, error: null }],
    responses: [{ error: { code: '23505', message: 'duplicate key' } }],
  });
  const result = await exports.inviteOrganizationMember({}, form({ orgId: 'o1', email: 'repetido@correo.cl' }));
  assert.match(result.error, /ya está invitado/);
});

test('quitar a un integrante de la organización funciona', async () => {
  const { exports, paths } = load('features/organizations/actions.ts', {
    responses: [{ error: null }],
  });
  const result = await exports.removeOrganizationMember({}, form({ memberId: 'm1', orgId: 'o1' }));
  assert.equal(result.error, undefined);
  assert.ok(paths.includes('/mis-organizaciones/o1/miembros'));
});
