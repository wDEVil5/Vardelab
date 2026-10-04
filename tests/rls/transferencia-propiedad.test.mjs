import { test } from 'node:test';
import assert from 'node:assert/strict';
import { queryAs, expectError, SEED } from './client.mjs';

// La propiedad se transfiere con consentimiento (M111): el dueño ofrece, el
// destinatario acepta o rechaza, y el dueño o un admin pueden cancelar la
// oferta. Pruebas reales contra Postgres.
//
// Cada prueba crea su propia organización dentro de la transacción (queryAs
// hace begin/rollback), sin compartir filas con el seed ni con otros archivos.

const ORG_PRUEBA = 'a0000000-0000-0000-0000-0000000000f2';

const CREAR_ORG = `
  insert into public.organizations (id, owner_id, nombre, tipo)
  values ('${ORG_PRUEBA}', '${SEED.DIEGO}', 'Organización de transferencia', 'social');
`;

const MEMBRESIA_VALENTINA = `
  insert into public.organization_members (org_id, user_id, invited_email, status, invited_by)
  values ('${ORG_PRUEBA}', '${SEED.VALENTINA}', 'estudiante@demo.cl', 'activo', '${SEED.DIEGO}');
`;

const MEMBRESIA_MARCOS = `
  insert into public.organization_members (org_id, user_id, invited_email, status, invited_by)
  values ('${ORG_PRUEBA}', '${SEED.MARCOS}', 'moderacion@demo.cl', 'activo', '${SEED.DIEGO}');
`;

const OFRECER_A_VALENTINA = `
  select public.offer_organization_ownership('${ORG_PRUEBA}', '${SEED.VALENTINA}');
`;

const OFERTA_ACTUAL = `(select id from public.organization_ownership_offers where org_id = '${ORG_PRUEBA}' order by created_at desc limit 1)`;

test('ofrecer la propiedad no la cambia: el dueño sigue siendo el mismo hasta que se acepte', () => {
  const salida = queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `
      ${CREAR_ORG}
      ${MEMBRESIA_VALENTINA}
      ${OFRECER_A_VALENTINA}
      select 'owner', owner_id from public.organizations where id = '${ORG_PRUEBA}';
      select 'oferta', status from public.organization_ownership_offers where org_id = '${ORG_PRUEBA}';
    `,
  });
  assert.ok(salida.includes(`owner|${SEED.DIEGO}`), `la oferta cambió el dueño: ${salida}`);
  assert.ok(salida.includes('oferta|pendiente'), `la oferta no quedó pendiente: ${salida}`);
});

test('no se ofrece la propiedad a alguien que no es miembro activo', () => {
  expectError(
    () => queryAs({
      role: 'authenticated', userId: SEED.DIEGO,
      sql: `${CREAR_ORG} ${OFRECER_A_VALENTINA}`,
    }),
    /debe ser un miembro activo/,
  );
});

test('el destinatario acepta: recién ahí cambia el dueño, el anterior queda activo y se registra la auditoría', () => {
  const salida = queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `
      ${CREAR_ORG}
      ${MEMBRESIA_VALENTINA}
      ${OFRECER_A_VALENTINA}
      set request.jwt.claim.sub = '${SEED.VALENTINA}';
      select public.accept_organization_ownership(${OFERTA_ACTUAL});
      set role postgres;
      select 'owner', owner_id from public.organizations where id = '${ORG_PRUEBA}';
      select 'anterior', user_id, status from public.organization_members
        where org_id = '${ORG_PRUEBA}' and user_id = '${SEED.DIEGO}';
      select 'nuevo_miembro_duplicado', count(*) from public.organization_members
        where org_id = '${ORG_PRUEBA}' and user_id = '${SEED.VALENTINA}';
      select 'estado', status from public.organization_ownership_offers where org_id = '${ORG_PRUEBA}';
      select 'auditoria', accion, metadata->>'nuevo_dueno' from public.audit_logs
        where accion = 'organizacion_propiedad_transferida' and entidad_id = '${ORG_PRUEBA}';
    `,
  });
  assert.ok(salida.includes(`owner|${SEED.VALENTINA}`), `owner no cambió: ${salida}`);
  assert.ok(salida.includes(`anterior|${SEED.DIEGO}|activo`), `el dueño anterior no quedó activo: ${salida}`);
  assert.ok(salida.includes('nuevo_miembro_duplicado|0'), `el nuevo dueño quedó duplicado: ${salida}`);
  assert.ok(salida.includes('estado|aceptada'), `la oferta no quedó aceptada: ${salida}`);
  assert.ok(salida.some((l) => l.startsWith('auditoria|') && l.endsWith(`|${SEED.VALENTINA}`)), `sin auditoría: ${salida}`);
});

test('solo el destinatario puede aceptar: otro miembro recibe "no existe o no es para ti"', () => {
  expectError(
    () => queryAs({
      role: 'authenticated', userId: SEED.DIEGO,
      sql: `
        ${CREAR_ORG}
        ${MEMBRESIA_VALENTINA}
        ${MEMBRESIA_MARCOS}
        ${OFRECER_A_VALENTINA}
        set request.jwt.claim.sub = '${SEED.MARCOS}';
        select public.accept_organization_ownership(${OFERTA_ACTUAL});
      `,
    }),
    /no existe o no es para ti/,
  );
});

test('una oferta ya cancelada no se puede aceptar', () => {
  expectError(
    () => queryAs({
      role: 'authenticated', userId: SEED.DIEGO,
      sql: `
        ${CREAR_ORG}
        ${MEMBRESIA_VALENTINA}
        ${OFRECER_A_VALENTINA}
        select public.cancel_organization_ownership_offer(${OFERTA_ACTUAL});
        set request.jwt.claim.sub = '${SEED.VALENTINA}';
        select public.accept_organization_ownership(${OFERTA_ACTUAL});
      `,
    }),
    /ya no está pendiente/,
  );
});

test('rechazar la oferta deja el dueño igual y marca la oferta como rechazada', () => {
  const salida = queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `
      ${CREAR_ORG}
      ${MEMBRESIA_VALENTINA}
      ${OFRECER_A_VALENTINA}
      set request.jwt.claim.sub = '${SEED.VALENTINA}';
      select public.decline_organization_ownership_offer(${OFERTA_ACTUAL});
      set role postgres;
      select 'owner', owner_id from public.organizations where id = '${ORG_PRUEBA}';
      select 'estado', status from public.organization_ownership_offers where org_id = '${ORG_PRUEBA}';
    `,
  });
  assert.ok(salida.includes(`owner|${SEED.DIEGO}`), `rechazar cambió el dueño: ${salida}`);
  assert.ok(salida.includes('estado|rechazada'), `la oferta no quedó rechazada: ${salida}`);
});

test('ofrecer de nuevo reemplaza la oferta pendiente: nunca queda más de una a la vez', () => {
  const salida = queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `
      ${CREAR_ORG}
      ${MEMBRESIA_VALENTINA}
      ${MEMBRESIA_MARCOS}
      ${OFRECER_A_VALENTINA}
      select public.offer_organization_ownership('${ORG_PRUEBA}', '${SEED.MARCOS}');
      select 'pendientes', count(*) from public.organization_ownership_offers
        where org_id = '${ORG_PRUEBA}' and status = 'pendiente';
      select 'destino', to_user from public.organization_ownership_offers
        where org_id = '${ORG_PRUEBA}' and status = 'pendiente';
    `,
  });
  assert.ok(salida.includes('pendientes|1'), `hay más de una oferta pendiente: ${salida}`);
  assert.ok(salida.includes(`destino|${SEED.MARCOS}`), `la pendiente no es la última: ${salida}`);
});

test('un miembro que no es dueño no puede ofrecer la propiedad', () => {
  expectError(
    () => queryAs({
      role: 'authenticated', userId: SEED.DIEGO,
      sql: `
        ${CREAR_ORG}
        ${MEMBRESIA_VALENTINA}
        ${MEMBRESIA_MARCOS}
        set request.jwt.claim.sub = '${SEED.MARCOS}';
        select public.offer_organization_ownership('${ORG_PRUEBA}', '${SEED.VALENTINA}');
      `,
    }),
    /No autorizado/,
  );
});

test('el cliente no puede escribir directo en las ofertas: no se puede aceptar por un update', () => {
  const salida = queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `
      ${CREAR_ORG}
      ${MEMBRESIA_VALENTINA}
      ${OFRECER_A_VALENTINA}
      set request.jwt.claim.sub = '${SEED.VALENTINA}';
      update public.organization_ownership_offers set status = 'aceptada'
        where org_id = '${ORG_PRUEBA}' returning id;
      set role postgres;
      select 'estado', status from public.organization_ownership_offers where org_id = '${ORG_PRUEBA}';
    `,
  });
  assert.ok(salida.includes('estado|pendiente'), `el update del cliente cambió la oferta: ${salida}`);
});

test('no se acepta una oferta si el destinatario fue suspendido después de ofrecerla', () => {
  expectError(
    () => queryAs({
      role: 'authenticated', userId: SEED.DIEGO,
      sql: `
        ${CREAR_ORG}
        ${MEMBRESIA_VALENTINA}
        ${OFRECER_A_VALENTINA}
        set role postgres;
        update auth.users set banned_until = now() + interval '1 day' where id = '${SEED.VALENTINA}';
        set role authenticated;
        set request.jwt.claim.sub = '${SEED.VALENTINA}';
        select public.accept_organization_ownership(${OFERTA_ACTUAL});
      `,
    }),
    /suspendida/,
  );
});

test('un admin puede ofrecer la propiedad (vía de rescate de organizaciones sin dueño activo)', () => {
  const salida = queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `
      ${CREAR_ORG}
      ${MEMBRESIA_VALENTINA}
      set request.jwt.claim.sub = '${SEED.ADMIN}';
      select public.offer_organization_ownership('${ORG_PRUEBA}', '${SEED.VALENTINA}');
      set role postgres;
      select 'pendientes', count(*) from public.organization_ownership_offers
        where org_id = '${ORG_PRUEBA}' and status = 'pendiente';
    `,
  });
  assert.ok(salida.includes('pendientes|1'), `el admin no pudo ofrecer: ${salida}`);
});

test('el dueño anterior queda como miembro activo aunque su correo ya tuviera una invitación pendiente', () => {
  const salida = queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `
      ${CREAR_ORG}
      insert into public.organization_members (org_id, user_id, invited_email, status, invited_by)
      values ('${ORG_PRUEBA}', null, 'semilla@demo.cl', 'pendiente', '${SEED.DIEGO}');
      ${MEMBRESIA_VALENTINA}
      ${OFRECER_A_VALENTINA}
      set request.jwt.claim.sub = '${SEED.VALENTINA}';
      select public.accept_organization_ownership(${OFERTA_ACTUAL});
      set role postgres;
      select 'anterior', user_id, status from public.organization_members
        where org_id = '${ORG_PRUEBA}' and lower(invited_email) = 'semilla@demo.cl';
    `,
  });
  assert.ok(salida.includes(`anterior|${SEED.DIEGO}|activo`), `el dueño anterior quedó sin acceso: ${salida}`);
});
