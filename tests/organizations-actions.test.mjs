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

test('invitar a alguien que ya tiene cuenta queda pendiente hasta que acepte, y le manda correo a su bandeja', async () => {
  const { exports, sendEmailCalls, queries } = load('features/organizations/actions.ts', {
    currentUser: PATROCINADOR,
    rpcResponses: [{ data: 'u9', error: null }],
    responses: [{ error: null }, { data: { nombre: 'Fundación Semilla' } }],
  });
  const result = await exports.inviteOrganizationMember({}, form({ orgId: 'o1', email: 'nueva@correo.cl' }));
  assert.equal(result.ok, true);
  const insert = queries[0].steps.find(([m]) => m === 'insert');
  assert.equal(insert[1].status, 'pendiente');
  assert.equal(insert[1].user_id, 'u9');
  assert.equal(sendEmailCalls.length, 1);
  assert.equal(sendEmailCalls[0][3], '/mis-invitaciones');
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

test('ofrecer la propiedad sin datos completos no llama a la base', async () => {
  const { exports, rpcCalls } = load('features/organizations/actions.ts');
  const result = await exports.offerOrganizationOwnership({}, form({ orgId: 'o1' }));
  assert.match(result.error, /Falta/);
  assert.equal(rpcCalls.length, 0);
});

test('si la función SQL rechaza la oferta, no se envía correo', async () => {
  const { exports, emailCalls } = load('features/organizations/actions.ts', {
    rpcResponses: [{ error: { message: 'El nuevo dueño debe ser un miembro activo' } }],
  });
  const result = await exports.offerOrganizationOwnership({}, form({ orgId: 'o1', newOwnerId: 'u2' }));
  assert.match(result.error, /miembro activo/);
  assert.equal(emailCalls.length, 0);
});

test('ofrecer la propiedad llama a la función SQL, avisa por correo a quien recibe la oferta y revalida', async () => {
  const { exports, rpcCalls, emailCalls, paths } = load('features/organizations/actions.ts', {
    rpcResponses: [{ error: null }],
    responses: [{ data: { nombre: 'Fundación Semilla' }, error: null }],
  });
  const result = await exports.offerOrganizationOwnership({}, form({ orgId: 'o1', newOwnerId: 'u2' }));
  assert.equal(result.ok, true);
  assert.equal(rpcCalls[0].name, 'offer_organization_ownership');
  assert.equal(rpcCalls[0].args._org_id, 'o1');
  assert.equal(rpcCalls[0].args._new_owner_id, 'u2');
  assert.equal(emailCalls[0][0], 'u2');
  assert.equal(emailCalls[0][1], 'organizacion_propiedad_ofrecida');
  assert.match(emailCalls[0][2], /Fundación Semilla/);
  assert.equal(emailCalls[0][3], '/mis-invitaciones');
  assert.ok(paths.includes('/mis-organizaciones/o1/miembros'));
});

test('transferir a una cuenta suspendida explica el motivo real', async () => {
  const { exports } = load('features/organizations/actions.ts', {
    rpcResponses: [{ error: { message: 'La cuenta destino está suspendida' } }],
  });
  const result = await exports.offerOrganizationOwnership({}, form({ orgId: 'o1', newOwnerId: 'u2' }));
  assert.match(result.error, /suspendida/);
});

test('un rechazo de permiso no se presenta como error de miembro', async () => {
  const { exports } = load('features/organizations/actions.ts', {
    rpcResponses: [{ error: { message: 'No autorizado' } }],
  });
  const result = await exports.offerOrganizationOwnership({}, form({ orgId: 'o1', newOwnerId: 'u2' }));
  assert.match(result.error, /permiso/);
});

test('aceptar una invitación llama a la función SQL con la membresía y revalida la bandeja', async () => {
  const { exports, rpcCalls, paths } = load('features/organizations/actions.ts', {
    rpcResponses: [{ data: true, error: null }],
  });
  const result = await exports.acceptOrganizationInvitation({}, form({ memberId: 'm1' }));
  assert.equal(result.ok, true);
  assert.equal(rpcCalls[0].name, 'accept_organization_invitation');
  assert.equal(rpcCalls[0].args._member_id, 'm1');
  assert.ok(paths.includes('/mis-invitaciones'));
});

test('si la invitación ya no está disponible, aceptarla informa sin mentir', async () => {
  const { exports } = load('features/organizations/actions.ts', {
    rpcResponses: [{ data: false, error: null }],
  });
  const result = await exports.acceptOrganizationInvitation({}, form({ memberId: 'm1' }));
  assert.match(result.error, /No se pudo aceptar/);
});

test('rechazar una invitación borra solo las pendientes', async () => {
  const { exports, queries } = load('features/organizations/actions.ts', {
    responses: [{ error: null }],
  });
  const result = await exports.declineOrganizationInvitation({}, form({ memberId: 'm1' }));
  assert.equal(result.ok, true);
  const steps = queries[0].steps.map(([m]) => m);
  assert.ok(steps.includes('delete'));
  assert.ok(queries[0].steps.some(([m, col, val]) => m === 'eq' && col === 'status' && val === 'pendiente'));
});

test('aceptar la oferta llama a la función SQL y revalida la bandeja', async () => {
  const { exports, rpcCalls, paths } = load('features/organizations/actions.ts', {
    rpcResponses: [{ error: null }],
  });
  const result = await exports.acceptOrganizationOwnership({}, form({ offerId: 'of1' }));
  assert.equal(result.ok, true);
  assert.equal(rpcCalls[0].name, 'accept_organization_ownership');
  assert.equal(rpcCalls[0].args._offer_id, 'of1');
  assert.ok(paths.includes('/mis-invitaciones'));
});

test('aceptar una oferta que ya no está disponible lo dice sin tecnicismos', async () => {
  const { exports } = load('features/organizations/actions.ts', {
    rpcResponses: [{ error: { message: 'La oferta ya no está pendiente' } }],
  });
  const result = await exports.acceptOrganizationOwnership({}, form({ offerId: 'of1' }));
  assert.equal(result.error, 'Esta oferta ya no está disponible.');
});

test('rechazar una oferta llama a la función SQL', async () => {
  const { exports, rpcCalls } = load('features/organizations/actions.ts', {
    rpcResponses: [{ data: true, error: null }],
  });
  const result = await exports.declineOrganizationOwnership({}, form({ offerId: 'of1' }));
  assert.equal(result.ok, true);
  assert.equal(rpcCalls[0].name, 'decline_organization_ownership_offer');
});

test('cancelar una oferta que ya no está pendiente informa el error', async () => {
  const { exports } = load('features/organizations/actions.ts', {
    rpcResponses: [{ data: false, error: null }],
  });
  const result = await exports.cancelOrganizationOwnershipOffer({}, form({ offerId: 'of1', orgId: 'o1' }));
  assert.match(result.error, /No se pudo cancelar/);
});
