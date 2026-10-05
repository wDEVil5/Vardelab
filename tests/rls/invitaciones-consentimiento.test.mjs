import { test } from 'node:test';
import assert from 'node:assert/strict';
import { queryAs, SEED } from './client.mjs';

// M110: una invitación a una organización solo da acceso cuando la persona la
// acepta. Antes se activaba al invitar (cuenta existente) o al registrarse.
//
// Cada prueba crea su propia organización y membresía dentro de la transacción
// (queryAs hace begin/rollback), sin tocar filas del seed.

const ORG = 'a0000000-0000-0000-0000-0000000000f4';
const MEMBRESIA = 'f4000000-0000-0000-0000-000000000001';
const NUEVO_USUARIO = 'f4000000-0000-0000-0000-000000000002';

const CREAR_ORG = `
  insert into public.organizations (id, owner_id, nombre, tipo)
  values ('${ORG}', '${SEED.DIEGO}', 'Organización de consentimiento', 'social');
`;

const INVITAR_VALENTINA_PENDIENTE = `
  insert into public.organization_members (id, org_id, user_id, invited_email, status, invited_by)
  values ('${MEMBRESIA}', '${ORG}', '${SEED.VALENTINA}', 'estudiante@demo.cl', 'pendiente', '${SEED.DIEGO}');
`;

test('una invitación pendiente no da acceso a la organización', () => {
  const salida = queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `
      ${CREAR_ORG}
      ${INVITAR_VALENTINA_PENDIENTE}
      set request.jwt.claim.sub = '${SEED.VALENTINA}';
      update public.organizations set descripcion = 'Intento sin aceptar' where id = '${ORG}' returning id;
    `,
  });
  assert.deepEqual(salida, []);
});

test('el invitado acepta su invitación y recién ahí tiene acceso', () => {
  const salida = queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `
      ${CREAR_ORG}
      ${INVITAR_VALENTINA_PENDIENTE}
      set request.jwt.claim.sub = '${SEED.VALENTINA}';
      select public.accept_organization_invitation('${MEMBRESIA}');
      update public.organizations set descripcion = 'Editada tras aceptar' where id = '${ORG}' returning id;
    `,
  });
  assert.ok(salida.includes('t'), `la aceptación no devolvió verdadero: ${salida}`);
  assert.ok(salida.includes(ORG), `tras aceptar no tiene acceso: ${salida}`);
});

test('nadie puede aceptar una invitación que no es suya', () => {
  const salida = queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `
      ${CREAR_ORG}
      ${INVITAR_VALENTINA_PENDIENTE}
      set request.jwt.claim.sub = '${SEED.MARCOS}';
      select public.accept_organization_invitation('${MEMBRESIA}');
    `,
  });
  assert.deepEqual(salida, ['f']);
});

test('el invitado puede rechazar la invitación borrando su propia fila', () => {
  const salida = queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `
      ${CREAR_ORG}
      ${INVITAR_VALENTINA_PENDIENTE}
      set request.jwt.claim.sub = '${SEED.VALENTINA}';
      delete from public.organization_members where id = '${MEMBRESIA}' returning id;
    `,
  });
  assert.deepEqual(salida, [MEMBRESIA]);
});

test('registrarse con un correo invitado no activa la invitación: queda pendiente hasta aceptarla', () => {
  const salida = queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `
      ${CREAR_ORG}
      insert into public.organization_members (org_id, user_id, invited_email, status, invited_by)
      values ('${ORG}', null, 'nuevo-invitado@demo.cl', 'pendiente', '${SEED.DIEGO}');
      set role postgres;
      insert into auth.users (id, email) values ('${NUEVO_USUARIO}', 'nuevo-invitado@demo.cl');
      select 'estado', status, user_id from public.organization_members
        where org_id = '${ORG}' and lower(invited_email) = 'nuevo-invitado@demo.cl';
    `,
  });
  assert.ok(
    salida.includes(`estado|pendiente|${NUEVO_USUARIO}`),
    `el registro activó la invitación sin aceptación: ${salida}`,
  );
});

test('aceptar la invitación deja un aviso para quien invitó', () => {
  const salida = queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `
      ${CREAR_ORG}
      ${INVITAR_VALENTINA_PENDIENTE}
      set request.jwt.claim.sub = '${SEED.VALENTINA}';
      select public.accept_organization_invitation('${MEMBRESIA}');
      set role postgres;
      select 'aviso', user_id, tipo from public.notifications
        where tipo = 'organizacion_invitacion_aceptada' and user_id = '${SEED.DIEGO}';
    `,
  });
  assert.ok(salida.includes(`aviso|${SEED.DIEGO}|organizacion_invitacion_aceptada`), `sin aviso para quien invitó: ${salida}`);
});
