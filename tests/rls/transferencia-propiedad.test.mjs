import { test } from 'node:test';
import assert from 'node:assert/strict';
import { queryAs, expectError, SEED } from './client.mjs';

// M106: transfer_organization_ownership. Pruebas reales contra Postgres: la
// función es security definer, así que cada reautorización tiene que probarse
// directa por SQL, no solo desde la Server Action.
//
// Cada prueba crea su propia organización dentro de la transacción (queryAs
// hace begin/rollback): no comparte filas con el seed ni con otros archivos de
// prueba que corren en paralelo, que es lo que provocaba deadlocks.

const ORG_PRUEBA = 'a0000000-0000-0000-0000-0000000000f2';

const CREAR_ORG = `
  insert into public.organizations (id, owner_id, nombre, tipo)
  values ('${ORG_PRUEBA}', '${SEED.DIEGO}', 'Organización de transferencia', 'social');
`;

const MEMBRESIA_VALENTINA = `
  insert into public.organization_members (org_id, user_id, invited_email, status, invited_by)
  values ('${ORG_PRUEBA}', '${SEED.VALENTINA}', 'estudiante@demo.cl', 'activo', '${SEED.DIEGO}');
`;

test('solo el dueño puede transferir: un tercero recibe "No autorizado"', () => {
  expectError(
    () => queryAs({
      role: 'authenticated', userId: SEED.DIEGO,
      sql: `
        ${CREAR_ORG}
        ${MEMBRESIA_VALENTINA}
        set request.jwt.claim.sub = '${SEED.MARCOS}';
        select public.transfer_organization_ownership('${ORG_PRUEBA}', '${SEED.VALENTINA}');
      `,
    }),
    /No autorizado/,
  );
});

test('el destinatario tiene que ser miembro activo, no alguien ajeno a la organización', () => {
  expectError(
    () => queryAs({
      role: 'authenticated', userId: SEED.DIEGO,
      sql: `
        ${CREAR_ORG}
        select public.transfer_organization_ownership('${ORG_PRUEBA}', '${SEED.VALENTINA}');
      `,
    }),
    /debe ser un miembro activo/,
  );
});

test('una invitación pendiente no basta para recibir la propiedad', () => {
  expectError(
    () => queryAs({
      role: 'authenticated', userId: SEED.DIEGO,
      sql: `
        ${CREAR_ORG}
        insert into public.organization_members (org_id, user_id, invited_email, status, invited_by)
        values ('${ORG_PRUEBA}', '${SEED.VALENTINA}', 'estudiante@demo.cl', 'pendiente', '${SEED.DIEGO}');
        select public.transfer_organization_ownership('${ORG_PRUEBA}', '${SEED.VALENTINA}');
      `,
    }),
    /debe ser un miembro activo/,
  );
});

test('no se puede transferir la propiedad a uno mismo', () => {
  expectError(
    () => queryAs({
      role: 'authenticated', userId: SEED.DIEGO,
      sql: `
        ${CREAR_ORG}
        select public.transfer_organization_ownership('${ORG_PRUEBA}', '${SEED.DIEGO}');
      `,
    }),
    /Ya es el dueño/,
  );
});

test('transferir cambia el dueño, deja al anterior como miembro activo y registra notificación y auditoría', () => {
  const salida = queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `
      ${CREAR_ORG}
      ${MEMBRESIA_VALENTINA}
      select public.transfer_organization_ownership('${ORG_PRUEBA}', '${SEED.VALENTINA}');
      select 'owner', owner_id from public.organizations where id = '${ORG_PRUEBA}';
      select 'anterior', user_id, status from public.organization_members
        where org_id = '${ORG_PRUEBA}' and user_id = '${SEED.DIEGO}';
      select 'nuevo_miembro_duplicado', count(*) from public.organization_members
        where org_id = '${ORG_PRUEBA}' and user_id = '${SEED.VALENTINA}';
      set role postgres;
      select 'notificacion', tipo, mensaje, link from public.notifications
        where user_id = '${SEED.VALENTINA}' and tipo = 'organizacion_propiedad_transferida'
          and link = '/mis-organizaciones/${ORG_PRUEBA}/editar';
      select 'auditoria', accion, entidad, entidad_id, metadata->>'nuevo_dueno' from public.audit_logs
        where accion = 'organizacion_propiedad_transferida' and entidad_id = '${ORG_PRUEBA}';
    `,
  });

  assert.ok(salida.includes(`owner|${SEED.VALENTINA}`), `owner no cambió: ${salida}`);
  assert.ok(salida.includes(`anterior|${SEED.DIEGO}|activo`), `el dueño anterior no quedó activo: ${salida}`);
  assert.ok(salida.includes('nuevo_miembro_duplicado|0'), `el nuevo dueño quedó duplicado como miembro: ${salida}`);
  const notif = salida.find((l) => l.startsWith('notificacion|'));
  assert.ok(notif, 'no se creó la notificación in-app');
  const audit = salida.find((l) => l.startsWith('auditoria|'));
  assert.ok(audit, 'no se registró auditoría');
  assert.ok(audit.endsWith(`|${SEED.VALENTINA}`), `auditoría sin el nuevo dueño: ${audit}`);
});

test('el dueño anterior ya no puede volver a transferir después de cederla', () => {
  expectError(
    () => queryAs({
      role: 'authenticated', userId: SEED.DIEGO,
      sql: `
        ${CREAR_ORG}
        ${MEMBRESIA_VALENTINA}
        select public.transfer_organization_ownership('${ORG_PRUEBA}', '${SEED.VALENTINA}');
        select public.transfer_organization_ownership('${ORG_PRUEBA}', '${SEED.DIEGO}');
      `,
    }),
    /No autorizado/,
  );
});

test('no se transfiere la propiedad a una cuenta suspendida (quedaría sin nadie que actúe)', () => {
  expectError(
    () => queryAs({
      role: 'authenticated', userId: SEED.DIEGO,
      sql: `
        ${CREAR_ORG}
        ${MEMBRESIA_VALENTINA}
        set role postgres;
        update auth.users set banned_until = now() + interval '1 day' where id = '${SEED.VALENTINA}';
        set role authenticated;
        set request.jwt.claim.sub = '${SEED.DIEGO}';
        select public.transfer_organization_ownership('${ORG_PRUEBA}', '${SEED.VALENTINA}');
      `,
    }),
    /suspendida/,
  );
});

test('un admin puede transferir la propiedad (vía de rescate de organizaciones sin dueño activo)', () => {
  const salida = queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `
      ${CREAR_ORG}
      ${MEMBRESIA_VALENTINA}
      set request.jwt.claim.sub = '${SEED.ADMIN}';
      select public.transfer_organization_ownership('${ORG_PRUEBA}', '${SEED.VALENTINA}');
      set role postgres;
      select 'owner', owner_id from public.organizations where id = '${ORG_PRUEBA}';
    `,
  });
  assert.ok(salida.includes(`owner|${SEED.VALENTINA}`), `el admin no pudo transferir: ${salida}`);
});

test('el dueño anterior queda como miembro activo aunque su correo ya tuviera una invitación pendiente', () => {
  const salida = queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `
      ${CREAR_ORG}
      insert into public.organization_members (org_id, user_id, invited_email, status, invited_by)
      values ('${ORG_PRUEBA}', null, 'semilla@demo.cl', 'pendiente', '${SEED.DIEGO}');
      ${MEMBRESIA_VALENTINA}
      select public.transfer_organization_ownership('${ORG_PRUEBA}', '${SEED.VALENTINA}');
      set role postgres;
      select 'anterior', user_id, status from public.organization_members
        where org_id = '${ORG_PRUEBA}' and lower(invited_email) = 'semilla@demo.cl';
    `,
  });
  assert.ok(salida.includes(`anterior|${SEED.DIEGO}|activo`), `el dueño anterior quedó sin acceso: ${salida}`);
});
