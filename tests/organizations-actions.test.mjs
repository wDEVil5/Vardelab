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

test('un miembro que no es dueño no puede eliminar la organización y no llega a consultar sus proyectos', async () => {
  const { exports, queries } = load('features/organizations/actions.ts', {
    currentUser: { id: 'u-miembro', esPatrocinador: true },
    extraModules: { '@/features/organizations/queries': { getMyOrganization: async () => ({ id: 'o1', owner_id: 'u-dueno' }) } },
  });
  const result = await exports.deleteOrganization({}, form({ orgId: 'o1' }));
  assert.match(result.error, /Solo el dueño/);
  assert.equal(queries.length, 0);
});

test('eliminar una organización con proyectos no la deja borrar', async () => {
  const { exports } = load('features/organizations/actions.ts', {
    currentUser: PATROCINADOR,
    extraModules: { '@/features/organizations/queries': { getMyOrganization: async () => ({ id: 'o1', owner_id: 'u1' }) } },
    responses: [{ count: 2 }],
  });
  const result = await exports.deleteOrganization({}, form({ orgId: 'o1' }));
  assert.match(result.error, /con proyectos/);
});

test('el dueño de una organización sin proyectos sí la borra', async () => {
  const { exports } = load('features/organizations/actions.ts', {
    currentUser: PATROCINADOR,
    extraModules: { '@/features/organizations/queries': { getMyOrganization: async () => ({ id: 'o1', owner_id: 'u1' }) } },
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

test('transferir la propiedad sin datos completos no llama a la base', async () => {
  const { exports, rpcCalls } = load('features/organizations/actions.ts');
  const result = await exports.transferOrganizationOwnership({}, form({ orgId: 'o1' }));
  assert.match(result.error, /Falta/);
  assert.equal(rpcCalls.length, 0);
});

test('si la función SQL rechaza la transferencia, no se envía correo', async () => {
  const { exports, emailCalls } = load('features/organizations/actions.ts', {
    rpcResponses: [{ error: { message: 'El nuevo dueño debe ser un miembro activo' } }],
  });
  const result = await exports.transferOrganizationOwnership({}, form({ orgId: 'o1', newOwnerId: 'u2' }));
  assert.match(result.error, /miembro activo/);
  assert.equal(emailCalls.length, 0);
});

test('transferir con éxito llama a la función SQL, avisa por correo al nuevo dueño y revalida', async () => {
  const { exports, rpcCalls, emailCalls, paths } = load('features/organizations/actions.ts', {
    rpcResponses: [{ error: null }],
    responses: [{ data: { nombre: 'Fundación Semilla' }, error: null }],
  });
  const result = await exports.transferOrganizationOwnership({}, form({ orgId: 'o1', newOwnerId: 'u2' }));
  assert.equal(result.ok, true);
  assert.equal(rpcCalls[0].name, 'transfer_organization_ownership');
  assert.equal(rpcCalls[0].args._org_id, 'o1');
  assert.equal(rpcCalls[0].args._new_owner_id, 'u2');
  assert.equal(emailCalls[0][0], 'u2');
  assert.equal(emailCalls[0][1], 'organizacion_propiedad_transferida');
  assert.match(emailCalls[0][2], /Fundación Semilla/);
  assert.equal(emailCalls[0][3], '/mis-organizaciones/o1/editar');
  assert.ok(paths.includes('/mis-organizaciones/o1/miembros'));
});

test('transferir a una cuenta suspendida explica el motivo real', async () => {
  const { exports } = load('features/organizations/actions.ts', {
    rpcResponses: [{ error: { message: 'La cuenta destino está suspendida' } }],
  });
  const result = await exports.transferOrganizationOwnership({}, form({ orgId: 'o1', newOwnerId: 'u2' }));
  assert.match(result.error, /suspendida/);
});

test('un rechazo de permiso no se presenta como error de miembro', async () => {
  const { exports } = load('features/organizations/actions.ts', {
    rpcResponses: [{ error: { message: 'No autorizado' } }],
  });
  const result = await exports.transferOrganizationOwnership({}, form({ orgId: 'o1', newOwnerId: 'u2' }));
  assert.match(result.error, /permiso/);
});
