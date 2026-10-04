import { test } from 'node:test';
import assert from 'node:assert/strict';
import { queryAs, expectError, SEED } from './client.mjs';

// M106: transfer_organization_ownership. Pruebas reales contra Postgres: la
// función es security definer, así que cada reautorización tiene que probarse
// directa por SQL, no solo desde la Server Action.
//
// Cada prueba crea sus propias membresías dentro de la transacción (queryAs
// hace begin/rollback), así que no contamina el seed.

const MEMBRESIA_VALENTINA = `
  insert into public.organization_members (org_id, user_id, invited_email, status, invited_by)
  values ('${SEED.ORG_DIEGO}', '${SEED.VALENTINA}', 'estudiante@demo.cl', 'activo', '${SEED.DIEGO}');
`;

test('solo el dueño puede transferir: un tercero recibe "No autorizado"', () => {
  expectError(
    () => queryAs({
      role: 'authenticated', userId: SEED.DIEGO,
      sql: `
        ${MEMBRESIA_VALENTINA}
        set request.jwt.claim.sub = '${SEED.MARCOS}';
        select public.transfer_organization_ownership('${SEED.ORG_DIEGO}', '${SEED.VALENTINA}');
      `,
    }),
    /No autorizado/,
  );
});

test('el destinatario tiene que ser miembro activo, no alguien ajeno a la organización', () => {
  expectError(
    () => queryAs({
      role: 'authenticated', userId: SEED.DIEGO,
      sql: `select public.transfer_organization_ownership('${SEED.ORG_DIEGO}', '${SEED.VALENTINA}');`,
    }),
    /debe ser un miembro activo/,
  );
});

test('una invitación pendiente no basta para recibir la propiedad', () => {
  expectError(
    () => queryAs({
      role: 'authenticated', userId: SEED.DIEGO,
      sql: `
        insert into public.organization_members (org_id, user_id, invited_email, status, invited_by)
        values ('${SEED.ORG_DIEGO}', '${SEED.VALENTINA}', 'estudiante@demo.cl', 'pendiente', '${SEED.DIEGO}');
        select public.transfer_organization_ownership('${SEED.ORG_DIEGO}', '${SEED.VALENTINA}');
      `,
    }),
    /debe ser un miembro activo/,
  );
});

test('no se puede transferir la propiedad a uno mismo', () => {
  expectError(
    () => queryAs({
      role: 'authenticated', userId: SEED.DIEGO,
      sql: `select public.transfer_organization_ownership('${SEED.ORG_DIEGO}', '${SEED.DIEGO}');`,
    }),
    /Ya es el dueño/,
  );
});

test('transferir cambia el dueño, deja al anterior como miembro activo y registra notificación y auditoría', () => {
  const salida = queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `
      ${MEMBRESIA_VALENTINA}
      select public.transfer_organization_ownership('${SEED.ORG_DIEGO}', '${SEED.VALENTINA}');
      select 'owner', owner_id from public.organizations where id = '${SEED.ORG_DIEGO}';
      select 'anterior', user_id, status from public.organization_members
        where org_id = '${SEED.ORG_DIEGO}' and user_id = '${SEED.DIEGO}';
      select 'nuevo_miembro_duplicado', count(*) from public.organization_members
        where org_id = '${SEED.ORG_DIEGO}' and user_id = '${SEED.VALENTINA}';
      set role postgres;
      select 'notificacion', tipo, mensaje, link from public.notifications
        where user_id = '${SEED.VALENTINA}' and tipo = 'organizacion_propiedad_transferida';
      select 'auditoria', accion, entidad, entidad_id, metadata->>'nuevo_dueno' from public.audit_logs
        where accion = 'organizacion_propiedad_transferida' and entidad_id = '${SEED.ORG_DIEGO}';
    `,
  });

  assert.ok(salida.includes(`owner|${SEED.VALENTINA}`), `owner no cambió: ${salida}`);
  assert.ok(salida.includes(`anterior|${SEED.DIEGO}|activo`), `el dueño anterior no quedó activo: ${salida}`);
  assert.ok(salida.includes('nuevo_miembro_duplicado|0'), `el nuevo dueño quedó duplicado como miembro: ${salida}`);
  const notif = salida.find((l) => l.startsWith('notificacion|'));
  assert.ok(notif, 'no se creó la notificación in-app');
  assert.ok(notif.includes('/mis-organizaciones/' + SEED.ORG_DIEGO + '/editar'));
  const audit = salida.find((l) => l.startsWith('auditoria|'));
  assert.ok(audit, 'no se registró auditoría');
  assert.ok(audit.endsWith(`|${SEED.VALENTINA}`), `auditoría sin el nuevo dueño: ${audit}`);
});

test('el dueño anterior ya no puede volver a transferir después de cederla', () => {
  expectError(
    () => queryAs({
      role: 'authenticated', userId: SEED.DIEGO,
      sql: `
        ${MEMBRESIA_VALENTINA}
        select public.transfer_organization_ownership('${SEED.ORG_DIEGO}', '${SEED.VALENTINA}');
        select public.transfer_organization_ownership('${SEED.ORG_DIEGO}', '${SEED.DIEGO}');
      `,
    }),
    /No autorizado/,
  );
});
